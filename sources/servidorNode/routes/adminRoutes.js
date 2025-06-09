const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const dividendoController = require('../controllers/dividendoController');

// Middleware de autenticación de administrador
const verificarAdmin = (req, res, next) => {
  console.log('=== VERIFICANDO ADMIN ===');
  console.log('Headers recibidos:', req.headers);
  console.log('Cookies recibidas:', req.headers.cookie);
  console.log('Session completa:', req.session);
  console.log('Usuario en sesión:', req.session?.usuario);
  console.log('Session ID:', req.sessionID);
  
  if (!req.session || !req.session.usuario) {
    console.log('❌ No hay sesión o usuario en la sesión');
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  if (req.session.usuario.rol !== 'admin') {
    console.log('❌ Usuario no es admin, rol:', req.session.usuario.rol);
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
  }
  
  console.log('✅ Admin verificado correctamente:', req.session.usuario.nombre);
  console.log('========================');
  next();
};

// Aplicar middleware a todas las rutas
router.use(verificarAdmin);

// Rutas de gestión de usuarios
router.get('/usuarios', adminController.obtenerUsuarios);
router.put('/usuarios/:id/rol', adminController.cambiarRolUsuario);
router.put('/usuarios/:id/estado', adminController.cambiarEstadoUsuario);
router.delete('/usuarios/:id', adminController.eliminarUsuario);

// Rutas de estadísticas
router.get('/estadisticas', (req, res, next) => {
  console.log('🔗 Ruta /estadisticas accedida');
  console.log('🔗 URL completa:', req.originalUrl);
  console.log('🔗 Método:', req.method);
  next();
}, adminController.obtenerEstadisticas);

console.log('✅ Rutas de admin configuradas correctamente');

module.exports = router;
