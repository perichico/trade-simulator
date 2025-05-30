const express = require('express');
const router = express.Router();
const { Usuario, Portafolio, PortafolioActivo, Activo } = require('../models/index');

// Middleware de autenticación
const verificarAutenticacion = (req, res, next) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  next();
};

// Obtener historial de patrimonio de un usuario
router.get('/historial/:usuarioId', verificarAutenticacion, async (req, res) => {
  try {
    const { usuarioId } = req.params;
    console.log(`Obteniendo historial de patrimonio para usuario: ${usuarioId}`);
    
    // Verificar que el usuario actual puede acceder a estos datos
    if (req.session.usuario.id !== parseInt(usuarioId) && req.session.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para acceder a estos datos' });
    }
    
    // Obtener portafolios del usuario con sus activos
    const portafolios = await Portafolio.findAll({
      where: { usuario_id: usuarioId },
      include: [{
        model: PortafolioActivo,
        as: 'activos',
        include: [{
          model: Activo,
          as: 'activo'
        }]
      }]
    });
    
    // Calcular valor total del patrimonio
    let valorTotal = 0;
    const activosDetalle = [];
    
    for (const portafolio of portafolios) {
      for (const activoPortafolio of portafolio.activos || []) {
        const valorActivo = activoPortafolio.cantidad * (activoPortafolio.activo?.precio_actual || 0);
        valorTotal += valorActivo;
        
        activosDetalle.push({
          activo: activoPortafolio.activo?.nombre || 'Activo desconocido',
          cantidad: activoPortafolio.cantidad,
          precioUnitario: activoPortafolio.activo?.precio_actual || 0,
          valorTotal: valorActivo,
          portafolio: portafolio.nombre
        });
      }
    }
    
    const historial = {
      usuarioId: parseInt(usuarioId),
      fecha: new Date().toISOString(),
      valorTotal,
      cantidadPortafolios: portafolios.length,
      cantidadActivos: activosDetalle.length,
      activos: activosDetalle
    };
    
    console.log(`Historial calculado: valor total ${valorTotal}`);
    res.json(historial);
    
  } catch (error) {
    console.error('Error al obtener historial de patrimonio:', error);
    res.status(500).json({ 
      error: 'Error al obtener historial de patrimonio',
      details: error.message 
    });
  }
});

module.exports = router;
