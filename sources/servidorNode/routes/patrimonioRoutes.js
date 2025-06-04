const express = require('express');
const router = express.Router();
const patrimonioController = require('../controllers/patrimonioController');

// Middleware para verificar autenticación
const verificarAutenticacion = (req, res, next) => {
    if (!req.session.usuario) {
        return res.status(401).json({ error: "Usuario no autenticado" });
    }
    next();
};

// Rutas de patrimonio
router.get('/historial/:usuarioId', verificarAutenticacion, patrimonioController.obtenerHistorialPatrimonio);
router.get('/historial/:usuarioId/portafolio/:portafolioId', verificarAutenticacion, patrimonioController.obtenerHistorialPatrimonio);
router.get('/actual/:usuarioId', verificarAutenticacion, patrimonioController.obtenerPatrimonioActual);

module.exports = router;
