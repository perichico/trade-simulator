const express = require('express');
const router = express.Router();
const activoController = require('../controllers/activoController');

// Rutas de activos
router.get('/', activoController.obtenerActivos);

// Obtener activo por ID con manejo de errores mejorado
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Buscando activo con ID:', id);
        
        const activo = await Activo.findByPk(id, {
            include: [{
                model: TipoActivo,
                as: 'tipoActivo',
                required: false // Hacer la relación opcional
            }]
        });
        
        if (!activo) {
            console.log('Activo no encontrado con ID:', id);
            return res.status(404).json({ 
                error: true,
                mensaje: 'Activo no encontrado' 
            });
        }
        
        // Asegurar que tipoActivo tenga un valor por defecto si es null
        const activoConTipo = {
            ...activo.toJSON(),
            tipoActivo: activo.tipoActivo || { id: 1, nombre: 'Acción' }
        };
        
        console.log('Activo encontrado:', activoConTipo.nombre);
        res.json(activoConTipo);
        
    } catch (error) {
        console.error('Error al obtener activo por ID:', error);
        res.status(500).json({ 
            error: true,
            mensaje: 'Error interno del servidor',
            detalles: error.message
        });
    }
});

module.exports = router;
