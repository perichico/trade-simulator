const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminActivosController = require('../controllers/adminActivosController');

// Middleware de autenticación y autorización
const requireAdmin = (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({ error: 'No hay sesión activa' });
    }
    
    if (req.session.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
    }
    
    next();
};

// Rutas de usuarios
router.get('/usuarios', requireAdmin, adminController.obtenerUsuarios);
router.put('/usuarios/:id/rol', requireAdmin, adminController.cambiarRolUsuario);
router.put('/usuarios/:id/estado', requireAdmin, adminController.cambiarEstadoUsuario);
router.delete('/usuarios/:id', requireAdmin, adminController.eliminarUsuario);
router.get('/estadisticas', requireAdmin, adminController.obtenerEstadisticas);

// Rutas de activos
router.get('/activos', requireAdmin, adminController.obtenerActivos);
router.post('/activos', requireAdmin, adminController.crearActivo);
router.put('/activos/:id', requireAdmin, adminController.actualizarActivo);
router.delete('/activos/:id', requireAdmin, adminController.eliminarActivo);
router.get('/estadisticas-activos', requireAdmin, adminController.obtenerEstadisticasActivos);

// Ruta para obtener tipos de activos - usar el controlador correcto
router.get('/tipos-activos', requireAdmin, adminActivosController.obtenerTiposActivos);

module.exports = router;
