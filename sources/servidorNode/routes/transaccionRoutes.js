const express = require('express');
const router = express.Router();
const transaccionController = require('../controllers/transaccionController');

// Rutas de Transaccion
router.get('/transacciones', transaccionController.obtenerTransacciones);
router.post('/creartransaccion', transaccionController.crearTransaccion);
router.post('/transacciones/:usuario', transaccionController.obtenerTransaccionesPorUsuario);

module.exports = router;