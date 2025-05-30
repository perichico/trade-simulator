const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarAdmin } = require('../middleware/authMiddleware');

// Middleware de logging para debug
router.use((req, res, next) => {
    console.log('🔍 Admin Route:', req.method, req.path);
    console.log('🔍 Sesión existe:', !!req.session);
    console.log('🔍 Usuario en sesión:', req.session?.usuario?.nombre);
    next();
});

// Rutas de gestión de usuarios (sin middleware global para debug)
router.get('/usuarios', adminController.obtenerUsuarios);
router.get('/estadisticas', adminController.obtenerEstadisticas);
router.put('/usuarios/:id/rol', verificarAdmin, adminController.cambiarRolUsuario);
router.put('/usuarios/:id/estado', verificarAdmin, adminController.cambiarEstadoUsuario);
router.delete('/usuarios/:id', verificarAdmin, adminController.eliminarUsuario);

module.exports = router;
