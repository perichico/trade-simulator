const express = require('express');
const router = express.Router();
const activoController = require('../controllers/activoController');

// Rutas de activos
router.get('/', activoController.obtenerActivos); // Ahora soporta ?tipo=nombre_tipo
router.get('/activos/:id', activoController.obtenerActivoPorId);

module.exports = router;
