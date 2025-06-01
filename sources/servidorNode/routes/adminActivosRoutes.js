const express = require('express');
const router = express.Router();
const adminActivosController = require('../controllers/adminActivosController');

// Middleware para verificar que el usuario sea administrador
const verificarAdmin = (req, res, next) => {
    console.log('🔐 Verificando permisos de admin para activos...');
    console.log('🔐 Sesión:', req.session?.usuario?.nombre, 'Rol:', req.session?.usuario?.rol);
    
    if (!req.session || !req.session.usuario) {
        console.log('❌ No hay sesión activa');
        return res.status(401).json({ error: 'No hay sesión activa' });
    }
    
    if (req.session.usuario.rol !== 'admin') {
        console.log('❌ Usuario no es administrador:', req.session.usuario.rol);
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
    }
    
    console.log('✅ Usuario admin verificado');
    next();
};

// Rutas de administración de activos
router.get('/activos', verificarAdmin, adminActivosController.obtenerActivos);
router.get('/estadisticas-activos', verificarAdmin, adminActivosController.obtenerEstadisticasActivos);
router.post('/activos', verificarAdmin, adminActivosController.crearActivo);
router.put('/activos/:id', verificarAdmin, adminActivosController.actualizarActivo);
router.delete('/activos/:id', verificarAdmin, adminActivosController.eliminarActivo);

module.exports = router;
