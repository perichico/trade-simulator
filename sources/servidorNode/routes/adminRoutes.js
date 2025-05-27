const express = require('express');
const router = express.Router();
const { verificarAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// Todas las rutas requieren ser administrador
router.use(verificarAdmin);

router.get('/', adminController.panelAdmin);
router.get('/usuarios', adminController.gestionarUsuarios);
router.post('/usuarios/cambiar-rol', adminController.cambiarRolUsuario);

module.exports = router;
