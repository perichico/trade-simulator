const verificarAutenticacion = (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
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

const verificarAdmin = (req, res, next) => {
    console.log('🔐 Verificando permisos de admin...');
    console.log('🔐 Sesión:', req.session?.usuario?.nombre, 'Rol:', req.session?.usuario?.rol);
    
    if (!req.session || !req.session.usuario) {
        console.log('❌ No hay sesión activa');
        return res.status(401).json({ error: 'No hay sesión activa' });
    }
    
    // Verificar si el usuario está suspendido
    if (req.session.usuario.estado === 'suspendido') {
        console.log('❌ Usuario suspendido');
        return res.status(403).json({ 
            error: "Usuario suspendido",
            tipo: "USUARIO_SUSPENDIDO",
            mensaje: "Tu cuenta ha sido suspendida. Contacta al administrador para más información."
        });
    }
    
    if (req.session.usuario.rol !== 'admin') {
        console.log('❌ Usuario no es administrador:', req.session.usuario.rol);
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
    }
    
    console.log('✅ Usuario admin verificado');
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
    verificarAutenticacion,
    verificarAdmin,
    verificarEstadoUsuario
};
