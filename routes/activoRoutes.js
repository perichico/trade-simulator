const express = require('express');
const router = express.Router();
const activoController = require('../controllers/activoController');

// Rutas de activos
router.get('/activos', activoController.obtenerActivos);
router.get('/activos/:id', activoController.obtenerActivo);

module.exports = router;
