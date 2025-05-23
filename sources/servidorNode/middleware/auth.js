// Middleware de autenticación
const verificarAutenticacion = (req, res, next) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  // Agregar información del usuario al request para uso en las rutas
  req.usuario = req.session.usuario;
  next();
};

module.exports = verificarAutenticacion;