const bcrypt = require("bcrypt");
const { sequelize, Usuario, Activo, Transaccion } = require("../models/index");

// Verificar estado de autenticación
exports.verificarAutenticacion = (req, res) => {
    if (req.session && req.session.usuario) {
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

        // Iniciar sesión
        req.session.usuario = usuario; // Guardar usuario en la sesión
        res.status(200).json({ 
            mensaje: "Login exitoso",
            usuario: usuario
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
    
    const usuarioId = req.session.usuario.id;

    // Obtener usuario
    const usuario = await Usuario.findByPk(usuarioId);
    
    // Obtener el portafolio seleccionado del usuario desde la sesión (si existe)
    const portafolioSeleccionado = req.session.portafolioSeleccionado || null;
    
    // Obtener el portafolio del usuario
    const { Portafolio } = require("../models/index");
    let portafolio;
    
    if (portafolioSeleccionado) {
      portafolio = await Portafolio.findOne({
        where: { 
          id: portafolioSeleccionado,
          usuario_id: usuarioId 
        }
      });
    } else {
      // Si no hay portafolio seleccionado, usar el portafolio principal
      portafolio = await Portafolio.findOne({
        where: { usuario_id: usuarioId },
        order: [['id', 'ASC']]
      });
    }
    
    if (!portafolio) {
      return res.status(404).json({ error: "Portafolio no encontrado" });
    }
    
    // Añadir el saldo del portafolio al objeto usuario para mantener compatibilidad
    usuario.dataValues.balance = portafolio.saldo || 10000.00;

    // Obtener transacciones del usuario with the associated asset data
    const transacciones = await Transaccion.findAll({
      where: { usuarioId },
      include: [{ model: Activo }],
      order: [["fecha", "DESC"]],
    });

    // Importar el servicio de precios
    const PreciosService = require('../services/preciosService');
    const preciosService = new PreciosService();

    // Agrupar activos sumando la cantidad total por activo
    const activosAgrupados = {};
    transacciones.forEach((transaccion) => {
      const { activoId, cantidad, activo } = transaccion;

      if (!activosAgrupados[activoId]) {
        activosAgrupados[activoId] = {
          id: activoId,
          nombre: activo.nombre,
          simbolo: activo.simbolo,
          precio: activo.ultimo_precio,
          cantidadTotal: 0,
          valorTotal: 0
        };
      }
      
      activosAgrupados[activoId].cantidadTotal += cantidad;
    });

    // Actualizar precios y calcular valores totales
    for (const activoId in activosAgrupados) {
      const activo = activosAgrupados[activoId];
      if (activo.cantidadTotal > 0) {
        try {
          const precioActual = await preciosService.obtenerPrecioActual(activo.simbolo);
          if (precioActual) {
            activo.precio = precioActual;
            activo.valorTotal = precioActual * activo.cantidadTotal;
          }
        } catch (error) {
          console.error(`Error al obtener precio para ${activo.simbolo}:`, error);
        }
      }
    }

    // Convertir objeto en array y filtrar activos con cantidad > 0
    const activos = Object.values(activosAgrupados)
      .filter(a => a.cantidadTotal > 0)
      .map(a => ({
        ...a,
        valorTotal: a.valorTotal || a.precio * a.cantidadTotal
      }));

    res.status(200).json({
      usuario,
      transacciones,
      activos
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cargar los datos del dashboard" });
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
        
        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        
        if (usuario.estado === 'suspendido') {
            return res.status(401).json({ error: "Usuario suspendido" });
        }
        
        req.session.usuario = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
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
