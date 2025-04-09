const bcrypt = require("bcrypt");
const { sequelize, Usuario, Activo, Transaccion } = require("../models/index");

// Mostrar formulario de login
exports.mostrarLogin = (req, res) => {
    res.render("login", { mensaje: req.flash("error") });
};

// Procesar login
exports.procesarLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscar usuario por email
        const usuario = await Usuario.findOne({ where: { email } });

        // Verificar si el usuario existe
        if (!usuario) {
            req.flash("error", "Usuario no encontrado");
            return res.redirect("/");
        }

        // Comparar contraseñas usando bcrypt
        const isPasswordValid = await bcrypt.compare(password, usuario.contrasena);

        if (!isPasswordValid) {
            req.flash("error", "Contraseña incorrecta");
            return res.redirect("/");
        }

        // Iniciar sesión
        req.session.usuario = usuario; // Guardar usuario en la sesión
        res.redirect("/dashboard");
        
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).send("Error en el servidor");
    }
};

// Cerrar sesión
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
};

// Mostrar dashboard 
exports.mostrarDashboard = async (req, res) => {
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

    res.render("dashboard", { usuario, transacciones, activos });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar el dashboard");
  }
};

// Registrar nuevo usuario
exports.registrarUsuario = async (req, res) => {
    const { nombre, email, password } = req.body;

    try {
        const usuarioExistente = await Usuario.findOne({ where: { email } });

        if (usuarioExistente) {
            req.flash("error", "El email ya está registrado");
            return res.redirect("/registro");
        }

        // Encriptar la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10);

        await Usuario.create({ nombre, email, contrasena: hashedPassword });
        req.flash("success", "Usuario registrado. Ahora puedes iniciar sesión.");
        res.redirect("/");

    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).send("Error en el servidor");
    }
};

// Mostrar formulario de registro
exports.mostrarRegistro = (req, res) => {
    res.render("registro", { mensaje: req.flash("error") });
};
