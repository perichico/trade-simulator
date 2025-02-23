const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Rutas para vistas de autenticación
router.get('/register', usuarioController.mostrarFormularioRegistro);
router.post('/register', usuarioController.registrarUsuario);

router.get('/login', usuarioController.mostrarFormularioLogin);
router.post('/login', usuarioController.iniciarSesion);

module.exports = router;
