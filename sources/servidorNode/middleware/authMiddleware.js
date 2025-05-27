const verificarAdmin = (req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }
    
    if (req.session.usuario.rol !== 'administrador') {
        return res.redirect('/dashboard');
    }
    
    next();
};

const verificarAutenticado = (req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }
    next();
};

module.exports = {
    verificarAdmin,
    verificarAutenticado
};
