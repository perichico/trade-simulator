const verificarAdmin = (req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }
    
    if (req.session.usuario.rol !== 'admin') {
        return res.redirect('/dashboard');
    }
    
    next();
};

const verificarAutenticado = (req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }
    
    // Verificar si el usuario está suspendido
    if (req.session.usuario.estado === 'suspendido') {
        return res.status(403).json({ 
            error: "Usuario suspendido",
            tipo: "USUARIO_SUSPENDIDO",
            mensaje: "Tu cuenta ha sido suspendida. Contacta al administrador para más información."
        });
    }
    
    next();
};

const verificarEstadoUsuario = (req, res, next) => {
    if (req.session && req.session.usuario && req.session.usuario.estado === 'suspendido') {
        return res.status(403).json({ 
            error: "Usuario suspendido",
            tipo: "USUARIO_SUSPENDIDO",
            mensaje: "Tu cuenta ha sido suspendida. Contacta al administrador para más información."
        });
    }
    next();
};

module.exports = {
    verificarAdmin,
    verificarAutenticado,
    verificarEstadoUsuario
};
