const bcrypt = require("bcrypt");
const { sequelize, Usuario, Activo, Transaccion, Portafolio, PortafolioActivo } = require("../models/index");

// Verificar estado de autenticación
exports.verificarAutenticacion = (req, res) => {
    if (req.session && req.session.usuario) {
        // Verificar si el usuario está suspendido
        if (req.session.usuario.estado === 'suspendido') {
            return res.status(403).json({
                autenticado: false,
                error: "Usuario suspendido",
                tipo: "USUARIO_SUSPENDIDO",
                mensaje: "Tu cuenta ha sido suspendida. Contacta al administrador para más información."
            });
        }
        
        // Aseguramos que la respuesta siempre tenga el mismo formato
        res.status(200).json({
            autenticado: true,
            usuario: req.session.usuario
        });
    } else {
        // Si no hay sesión, devolvemos autenticado: false
        res.status(200).json({
            autenticado: false,
            mensaje: "No hay sesión activa"
        });
    }
};

// Procesar login
exports.procesarLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscar usuario por email
        const usuario = await Usuario.findOne({ where: { email } });

        // Verificar si el usuario existe
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Comparar contraseñas usando bcrypt
        const isPasswordValid = await bcrypt.compare(password, usuario.contrasena);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        // Verificar si el usuario está suspendido
        if (usuario.estado === 'suspendido') {
            return res.status(403).json({ 
                error: "Usuario suspendido",
                tipo: "USUARIO_SUSPENDIDO",
                mensaje: "Tu cuenta ha sido suspendida. Contacta al administrador para más información."
            });
        }

        // Iniciar sesión
        req.session.usuario = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            estado: usuario.estado
        };
        
        res.status(200).json({ 
            mensaje: "Login exitoso",
            usuario: req.session.usuario
        });
        
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

// Cerrar sesión
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.status(200).json({ mensaje: "Sesión cerrada exitosamente" });
    });
};

// Obtener datos del dashboard 
exports.obtenerDatosDashboard = async (req, res) => {
  try {
    // Verificar si el usuario está autenticado
    if (!req.session || !req.session.usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }
    
    // Verificar si el usuario está suspendido
    if (req.session.usuario.estado === 'suspendido') {
      return res.status(403).json({ 
        error: "Usuario suspendido",
        tipo: "USUARIO_SUSPENDIDO",
        mensaje: "Tu cuenta ha sido suspendida. Contacta al administrador para más información."
      });
    }
    
    const usuarioId = req.session.usuario.id;

    // Obtener usuario
    const usuario = await Usuario.findByPk(usuarioId);
    
    // Obtener TODOS los portafolios del usuario
    const portafolios = await Portafolio.findAll({
      where: { usuario_id: usuarioId },
      order: [['id', 'ASC']]
    });
    
    if (!portafolios || portafolios.length === 0) {
      return res.status(404).json({ error: "No se encontraron portafolios" });
    }
    
    // Obtener el portafolio seleccionado del usuario desde la sesión (si existe)
    const portafolioSeleccionado = req.session.portafolioSeleccionado || null;
    
    // Determinar qué portafolio usar
    let portafolio;
    if (portafolioSeleccionado) {
      portafolio = portafolios.find(p => p.id === portafolioSeleccionado);
    }
    
    // Si no se encuentra el seleccionado o no hay selección, usar el primero
    if (!portafolio) {
      portafolio = portafolios[0];
    }
    
    // Añadir el saldo del portafolio al objeto usuario para mantener compatibilidad
    usuario.dataValues.balance = portafolio.saldo || 10000.00;

    // Obtener transacciones del portafolio específico (no solo del usuario)
    const transacciones = await Transaccion.findAll({
      where: { 
        usuarioId,
        portafolio_id: portafolio.id  // Filtrar por portafolio específico
      },
      include: [{ model: Activo }],
      order: [["fecha", "DESC"]],
    });

    // Importar el servicio de precios
    const PreciosService = require('../services/preciosService');
    const preciosService = new PreciosService();

    // Agrupar activos sumando la cantidad total por activo
    const activosAgrupados = {};

    // Procesar transacciones para agrupar activos
    transacciones.forEach(transaccion => {
      const activoId = transaccion.activo_id;
      const cantidad = transaccion.tipo_transaccion === 'compra' 
        ? transaccion.cantidad 
        : -transaccion.cantidad;

      if (!activosAgrupados[activoId]) {
        activosAgrupados[activoId] = {
          activo: transaccion.Activo,
          cantidadTotal: 0,
          valorInvertido: 0
        };
      }

      activosAgrupados[activoId].cantidadTotal += cantidad;
      activosAgrupados[activoId].valorInvertido += transaccion.precio_unitario * cantidad;
    });

    // Filtrar activos con cantidad > 0 y obtener precios actuales
    const activosEnPortafolio = await PortafolioActivo.findAll({
      where: { portafolio_id: portafolio.id },
      include: [{
        model: Activo,
        include: [TipoActivo]
      }]
    });

    // Crear array de activos con sus datos calculados
    const activosConDatos = [];
    for (const posicion of activosEnPortafolio) {
      if (posicion.cantidad > 0) {
        const activo = posicion.Activo;
        
        // Obtener precio actual
        const precioActualResponse = await preciosService.obtenerPrecioActual(activo.simbolo, activo.id);
        const precioActual = precioActualResponse?.precio || activo.ultimo_precio || 0;
        
        // Calcular valores
        const valorTotal = posicion.cantidad * precioActual;
        const costoBasis = posicion.cantidad * (posicion.precio_compra || 0);
        const rendimiento = valorTotal - costoBasis;
        const rendimientoPorcentaje = posicion.precio_compra > 0 ? 
          ((precioActual - posicion.precio_compra) / posicion.precio_compra) * 100 : 0;
        
        activosConDatos.push({
          id: activo.id,
          activoId: activo.id,
          nombre: activo.nombre,
          simbolo: activo.simbolo,
          cantidad: posicion.cantidad,
          precioCompra: posicion.precio_compra || 0,
          precioActual: precioActual,
          valorTotal: Math.round(valorTotal * 100) / 100,
          rendimiento: Math.round(rendimiento * 100) / 100,
          rendimientoPorcentaje: Math.round(rendimientoPorcentaje * 100) / 100,
          porcentajeDividendo: activo.porcentaje_dividendo || 0,
          ultima_actualizacion: new Date(),
          tipo: activo.TipoActivo?.nombre || 'Acción'
        });
      }
    }

    // Calcular valor total del portafolio y rendimiento total
    const valorTotalActivos = activosConDatos.reduce((total, activo) => 
      total + activo.valorTotal, 0
    );
    
    // Calcular patrimonio total (saldo + valor de activos)
    const patrimonioTotal = portafolio.saldo + valorTotalActivos;
    
    // Calcular rendimiento basado en el patrimonio total respecto al saldo inicial
    const saldoInicial = 10000.00;
    const rendimientoTotal = patrimonioTotal - saldoInicial;

    // Enviar datos separados: valor del portafolio (solo activos) y patrimonio total
    const valorTotalPortafolio = valorTotalActivos; // Solo el valor de los activos
    
    res.status(200).json({
      usuario: {
        ...usuario.toJSON(),
        balance: portafolio.saldo
      },
      transacciones,
      activos: activosConDatos,
      valorTotalPortafolio: Math.round(valorTotalPortafolio * 100) / 100,
      patrimonioTotal: Math.round(patrimonioTotal * 100) / 100,
      rendimientoTotal: Math.round(rendimientoTotal * 100) / 100,
      saldo: Math.round(portafolio.saldo * 100) / 100
    });

  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Mostrar página de login
exports.mostrarLogin = (req, res) => {
    res.status(200).json({ mensaje: "Página de login" });
};

// Mostrar página de registro
exports.mostrarRegistro = (req, res) => {
    res.status(200).json({ mensaje: "Página de registro" });
};

// Mostrar dashboard
exports.mostrarDashboard = (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ error: "No autorizado" });
    }
    res.status(200).json({ mensaje: "Dashboard" });
};

// Registrar nuevo usuario
exports.registrarUsuario = async (req, res) => {
    const { nombre, email, password } = req.body;

    try {
        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            return res.status(400).json({ error: "El email ya está registrado" });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear nuevo usuario
        const nuevoUsuario = await Usuario.create({
            nombre,
            email,
            contrasena: hashedPassword
        });

        // Crear sesión
        req.session.usuario = {
            id: nuevoUsuario.id,
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol
        };
        
        res.status(201).json({
            mensaje: "Usuario registrado exitosamente",
            usuario: {
                id: nuevoUsuario.id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol
            }
        });

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        
        const passwordValido = await bcrypt.compare(password, usuario.contrasena || usuario.password);
        if (!passwordValido) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        
        // Verificar si el usuario está suspendido
        if (usuario.estado === 'suspendido') {
            return res.status(403).json({ 
                error: "Usuario suspendido",
                tipo: "USUARIO_SUSPENDIDO",
                mensaje: "Tu cuenta ha sido suspendida. Contacta al administrador para más información."
            });
        }
        
        req.session.usuario = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            estado: usuario.estado
        };
        
        res.json({
            mensaje: "Login exitoso",
            usuario: req.session.usuario
        });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

// Logout
exports.logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Error al cerrar sesión" });
        }
        res.clearCookie('connect.sid');
        res.json({ mensaje: "Sesión cerrada exitosamente" });
    });
};

// Verificar sesión
exports.verificarSesion = async (req, res) => {
    if (req.session && req.session.usuario) {
        res.json({
            autenticado: true,
            usuario: req.session.usuario
        });
    } else {
        res.json({ autenticado: false });
    }
};

// Obtener perfil
exports.obtenerPerfil = async (req, res) => {
    try {
        // Verificar si el usuario está suspendido
        if (req.session.usuario.estado === 'suspendido') {
            return res.status(403).json({ 
                error: "Usuario suspendido",
                tipo: "USUARIO_SUSPENDIDO",
                mensaje: "Tu cuenta ha sido suspendida. Contacta al administrador para más información."
            });
        }
        
        const usuario = await Usuario.findByPk(req.session.usuario.id, {
            attributes: ['id', 'nombre', 'email', 'rol', 'estado', 'fechaRegistro']
        });
        
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        res.json(usuario);
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

// Obtener el patrimonio histórico del usuario
exports.obtenerHistorialPatrimonio = async (req, res) => {
    try {
        const usuarioId = req.params.usuarioId || (req.session.usuario && req.session.usuario.id);
        if (!usuarioId) {
            return res.status(401).json({ error: "No autorizado" });
        }
        
        // Obtener los portafolios del usuario
        const portafolios = await Portafolio.findAll({ where: { usuario_id: usuarioId } });
        if (!portafolios || portafolios.length === 0) {
            return res.status(200).json([]);
        }
        
        // TODO: Implementar lógica de historial de patrimonio
        // Por ahora retornar array vacío
        res.status(200).json([]);
        
    } catch (error) {
        console.error("Error al obtener historial de patrimonio:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

// Agregar método para seleccionar portafolio
exports.seleccionarPortafolio = async (req, res) => {
  try {
    const { portafolioId } = req.body;
    const usuarioId = req.session.usuario.id;
    
    // Verificar que el portafolio pertenece al usuario
    const portafolio = await Portafolio.findOne({
      where: { 
        id: portafolioId,
        usuario_id: usuarioId 
      }
    });
    
    if (!portafolio) {
      return res.status(404).json({ error: "Portafolio no encontrado" });
    }
    
    // Guardar la selección en la sesión
    req.session.portafolioSeleccionado = portafolioId;
    
    res.status(200).json({ 
      mensaje: "Portafolio seleccionado exitosamente",
      portafolio: {
        id: portafolio.id,
        nombre: portafolio.nombre,
        saldo: portafolio.saldo
      }
    });
    
  } catch (error) {
    console.error("Error al seleccionar portafolio:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
