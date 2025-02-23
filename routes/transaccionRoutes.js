const express = require('express');
const router = express.Router();
const transaccionController = require('../controllers/transaccionController');

// Rutas de Transaccion
router.get('/transacciones', transaccionController.obtenerTransacciones);
router.post('/comprar', transaccionController.comprarActivo);
router.post('/vender', transaccionController.venderActivo);

module.exports = router;