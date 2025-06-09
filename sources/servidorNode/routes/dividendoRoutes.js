const express = require('express');
const router = express.Router();
const dividendoController = require('../controllers/dividendoController');

// Middleware de autenticación
const requireAuth = (req, res, next) => {
  console.log('🔐 Verificando autenticación...');
  
  if (!req.session || !req.session.usuario) {
    console.log('❌ Usuario no autenticado');
    return res.status(401).json({ 
      error: 'Usuario no autenticado',
      mensaje: 'Debes iniciar sesión para acceder a esta función'
    });
  }
  
  console.log('✅ Usuario autenticado:', req.session.usuario.email);
  next();
};

// Middleware de autorización de admin
const requireAdmin = (req, res, next) => {
  if (req.session.usuario.rol !== 'admin') {
    return res.status(403).json({ 
      error: 'Permisos insuficientes',
      mensaje: 'Se requiere rol de administrador'
    });
  }
  next();
};

// Rutas públicas (requieren autenticación básica)
router.get('/', requireAuth, dividendoController.obtenerDividendos);
router.get('/usuario', requireAuth, dividendoController.obtenerDividendosPorUsuario);

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
router.post('/crear', requireAuth, requireAdmin, dividendoController.crearDividendo);
router.post('/procesar-automaticos', requireAuth, requireAdmin, dividendoController.procesarDividendosAutomaticos);
router.post('/procesar', requireAuth, requireAdmin, dividendoController.procesarDividendosAutomaticos);
router.post('/procesar-pendientes', requireAuth, requireAdmin, dividendoController.procesarDividendosPendientes);
router.put('/:id/marcar-pagado', requireAuth, requireAdmin, dividendoController.marcarDividendoComoPagado);
router.put('/:id/cancelar', requireAuth, requireAdmin, dividendoController.cancelarDividendo);
router.get('/:id/detalles', requireAuth, requireAdmin, dividendoController.obtenerDetallesDividendo);

module.exports = router;