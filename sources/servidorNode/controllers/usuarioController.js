const bcrypt = require("bcrypt");
const { sequelize, Usuario, Activo, Transaccion } = require("../models/index");

// Verificar estado de autenticación
exports.verificarAutenticacion = (req, res) => {
    if (req.session.usuario) {
        res.status(200).json({
            autenticado: true,
            usuario: req.session.usuario
        });
    } else {
        res.status(200).json({
            autenticado: false
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
    const usuarioId = req.session.usuario.id;

    // Obtener usuario
    const usuario = await Usuario.findByPk(usuarioId);

    // Obtener transacciones del usuario con los datos del activo asociado
    const transacciones = await Transaccion.findAll({
      where: { usuarioId },
      include: [{ model: Activo }],
      order: [["fecha", "DESC"]],
    });

    // Agrupar activos sumando la cantidad total por activo
    const activosAgrupados = {};
    transacciones.forEach((transaccion) => {
      const { activoId, cantidad, activo } = transaccion;

      if (!activosAgrupados[activoId]) {
        activosAgrupados[activoId] = {
          id: activoId,
          nombre: activo.nombre,
          simbolo: activo.simbolo,
          precio: activo.precio,
          cantidadTotal: 0,
        };
      }
      
      activosAgrupados[activoId].cantidadTotal += cantidad;
    });

    // Convertir objeto en array
    const activos = Object.values(activosAgrupados).filter(a => a.cantidadTotal > 0);

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

        res.status(201).json({
            mensaje: "Usuario registrado exitosamente",
            usuario: nuevoUsuario
        });

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};
