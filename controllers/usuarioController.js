const { Usuario } = require('../models/usuarioModel');

// Mostrar formulario de registro
const mostrarFormularioRegistro = (req, res) => {
    res.render('register'); // Muestra la vista de registro
};

// Registrar usuario
const registrarUsuario = async (req, res) => {
    try {
        const { Nombre, Correo, Contrasena } = req.body;

        // Guardamos la contraseña tal cual, sin encriptar (esto no es seguro)
        await Usuario.create({ 
            Nombre, 
            Correo, 
            Contrasena // Contraseña almacenada en texto plano
        });

        res.redirect('/login'); // Redirigir al login después del registro
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Mostrar formulario de login
const mostrarFormularioLogin = (req, res) => {
    res.render('login'); // Muestra la vista de login
};

// Iniciar sesión
const iniciarSesion = async (req, res) => {
    try {
        const { Correo, Contrasena } = req.body;

        const usuario = await Usuario.findOne({ where: { Correo } });
        if (!usuario) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        // Comprobamos la contraseña directamente (sin encriptación)
        if (usuario.Contrasena !== Contrasena) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        // Simulación de sesión (puedes usar express-session o JWT)
        req.session.usuarioId = usuario.ID;

        res.redirect('/usuarios'); // Redirigir al panel de usuarios después del login
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    mostrarFormularioRegistro,
    registrarUsuario,
    mostrarFormularioLogin,
    iniciarSesion
};
