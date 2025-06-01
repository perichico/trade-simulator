const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarAdmin } = require('../middleware/authMiddleware');

// Rutas de administración
router.get('/usuarios', verificarAdmin, adminController.obtenerUsuarios);
router.get('/estadisticas', verificarAdmin, adminController.obtenerEstadisticas);
router.put('/usuarios/:id/rol', verificarAdmin, adminController.cambiarRolUsuario);
router.put('/usuarios/:id/estado', verificarAdmin, adminController.cambiarEstadoUsuario);
router.delete('/usuarios/:id', verificarAdmin, adminController.eliminarUsuario);

module.exports = router;
