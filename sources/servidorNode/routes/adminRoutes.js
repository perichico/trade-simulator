const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Middleware para verificar que el usuario sea administrador
const verificarAdmin = (req, res, next) => {
    console.log('🔐 Verificando permisos de admin...');
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

// Rutas de administración
router.get('/usuarios', verificarAdmin, adminController.obtenerUsuarios);
router.get('/estadisticas', verificarAdmin, adminController.obtenerEstadisticas);
router.put('/usuarios/:id/rol', verificarAdmin, adminController.cambiarRolUsuario);
router.put('/usuarios/:id/estado', verificarAdmin, adminController.cambiarEstadoUsuario);
router.delete('/usuarios/:id', verificarAdmin, adminController.eliminarUsuario);

module.exports = router;
