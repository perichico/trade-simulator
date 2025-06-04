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
router.get('/', verificarAutenticacion, transaccionController.obtenerTransacciones);
router.post('/creartransaccion', verificarAutenticacion, transaccionController.crearTransaccion);
router.get('/usuario', verificarAutenticacion, transaccionController.obtenerTransaccionesPorUsuario);
router.get('/activo/:activoId', verificarAutenticacion, transaccionController.obtenerTransaccionesPorActivo);

module.exports = router;