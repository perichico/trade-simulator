const express = require('express');
const router = express.Router();
const transaccionController = require('../controllers/transaccionController');

// Middleware de autenticación
const verificarAutenticacion = (req, res, next) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  next();
};

// Rutas de Transaccion
router.get('/transacciones', verificarAutenticacion, transaccionController.obtenerTransacciones);
router.post('/creartransaccion', verificarAutenticacion, transaccionController.crearTransaccion);
router.post('/transacciones/:usuario', verificarAutenticacion, transaccionController.obtenerTransaccionesPorUsuario);

module.exports = router;