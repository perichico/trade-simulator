const express = require('express');
const router = express.Router();
const dividendoController = require('../controllers/dividendoController');

// Rutas públicas (requieren autenticación básica)
router.get('/', dividendoController.obtenerDividendos);
router.get('/usuario', dividendoController.obtenerDividendosPorUsuario);

// Ruta de debugging para verificar sesión
router.get('/debug/sesion', (req, res) => {
  res.json({
    sessionExists: !!req.session,
    sessionId: req.sessionID,
    userExists: !!req.session?.usuario,
    userId: req.session?.usuario?.id || null,
    sessionKeys: req.session ? Object.keys(req.session) : [],
    timestamp: new Date().toISOString()
  });
});

// Rutas de administrador
router.post('/crear', dividendoController.crearDividendo);
router.post('/procesar-automaticos', dividendoController.procesarDividendosAutomaticos);
router.put('/:id/marcar-pagado', dividendoController.marcarDividendoComoPagado);
router.put('/:id/cancelar', dividendoController.cancelarDividendo);
router.get('/:id/detalles', dividendoController.obtenerDetallesDividendo);

module.exports = router;