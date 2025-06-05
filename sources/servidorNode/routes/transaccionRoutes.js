const express = require('express');
const router = express.Router();
const transaccionController = require('../controllers/transaccionController');

// Middleware de autenticación
const verificarAutenticacion = (req, res, next) => {
  console.log('🔐 Verificando autenticación para transacciones');
  console.log('🔐 Session:', req.session?.usuario?.nombre || 'No autenticado');
  console.log('🔐 URL solicitada:', req.originalUrl);
  
  if (!req.session || !req.session.usuario) {
    console.log('❌ Usuario no autenticado');
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  console.log('✅ Usuario autenticado:', req.session.usuario.nombre);
  next();
};

// Rutas de transacciones
router.get('/', verificarAutenticacion, transaccionController.obtenerTransacciones);
router.get('/usuario', verificarAutenticacion, transaccionController.obtenerTransaccionesPorUsuario);
router.get('/activo/:activoId', verificarAutenticacion, transaccionController.obtenerTransaccionesPorActivo);
router.post('/creartransaccion', verificarAutenticacion, transaccionController.crearTransaccion);

// Ruta para obtener una transacción específica por ID (debe ir al final)
router.get('/:id', verificarAutenticacion, (req, res, next) => {
  console.log('🔍 Solicitando transacción por ID:', req.params.id);
  console.log('🔍 URL completa:', req.originalUrl);
  console.log('🔍 Método:', req.method);
  console.log('🔍 Parámetros:', req.params);
  next();
}, transaccionController.obtenerTransaccionPorId);

console.log('✅ Rutas de transacciones configuradas correctamente');

module.exports = router;