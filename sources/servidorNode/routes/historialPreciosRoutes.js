const express = require('express');
const router = express.Router();
const historialPreciosController = require('../controllers/historialPreciosController');

// Ruta para obtener el historial de precios de un activo
router.get('/:activoId', historialPreciosController.obtenerHistorialPrecios);

module.exports = router;