const express = require('express');
const dividendoController = require('../controllers/dividendoController');
const router = express.Router();

// Rutas para dividendos
router.get('/', dividendoController.obtenerDividendos);
router.get('/usuario', dividendoController.obtenerDividendosPorUsuario);
router.post('/procesar', dividendoController.procesarDividendosAutomaticos);

module.exports = router;