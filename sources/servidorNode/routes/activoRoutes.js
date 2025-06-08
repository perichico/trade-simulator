const express = require('express');
const router = express.Router();
const activoController = require('../controllers/activoController');

console.log('🔧 Configurando rutas de activos...');

// Rutas de activos
router.get('/', (req, res, next) => {
  console.log('📊 Acceso a GET /activos');
  console.log('📊 Query params:', req.query);
  next();
}, activoController.obtenerActivos);

router.get('/:id', (req, res, next) => {
  console.log('📊 Acceso a GET /activos/:id con ID:', req.params.id);
  next();
}, activoController.obtenerActivoPorId);

console.log('✅ Rutas de activos configuradas correctamente');

module.exports = router;
