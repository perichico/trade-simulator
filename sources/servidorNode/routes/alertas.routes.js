const express = require('express');
const router = express.Router();
const { Alerta } = require('../models');
const authMiddleware = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Obtener todas las alertas del usuario autenticado
router.get('/', async (req, res) => {
  try {
    const userId = req.usuario.id; // Obtenido del middleware de autenticación
    console.log(`Obteniendo alertas para el usuario ID: ${userId}`);
    
    const alertas = await Alerta.findAll({
      where: { usuarioId: userId }
    });
    
    console.log(`Se encontraron ${alertas.length} alertas`);
    return res.json(alertas);
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    return res.status(500).json({ message: 'Error al obtener alertas', error: error.message });
  }
});

// Crear una nueva alerta
router.post('/', async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { activoId, precioObjetivo, cantidadVenta, condicion, portafolioId } = req.body;
    
    console.log('Datos recibidos para crear alerta:', {
      usuarioId: userId,
      activoId,
      precioObjetivo,
      cantidadVenta,
      condicion,
      portafolioId
    });
    
    if (!activoId || !precioObjetivo || !cantidadVenta || !portafolioId) {
      return res.status(400).json({ 
        error: 'Activo, precio objetivo, cantidad a vender y portafolio son obligatorios' 
      });
    }
    
    if (cantidadVenta <= 0) {
      return res.status(400).json({ 
        error: 'La cantidad a vender debe ser mayor a 0' 
      });
    }

    // Verificar que el portafolio pertenezca al usuario
    const { PortafolioActivo, Portafolio } = require('../models');
    const portafolio = await Portafolio.findOne({
      where: { id: portafolioId, usuario_id: userId }
    });

    if (!portafolio) {
      return res.status(400).json({
        error: 'El portafolio especificado no te pertenece'
      });
    }

    // Verificar activos en el portafolio específico
    const posicion = await PortafolioActivo.findOne({
      where: {
        portafolio_id: portafolioId,
        activo_id: activoId
      }
    });

    const cantidadDisponible = posicion ? parseFloat(posicion.cantidad) : 0;
    
    console.log('Verificación de activos en alerta:', {
      portafolioId,
      activoId,
      posicion: posicion ? {
        cantidad: posicion.cantidad,
        precio_compra: posicion.precio_compra
      } : null,
      cantidadDisponible,
      cantidadSolicitada: cantidadVenta
    });

    if (cantidadDisponible < cantidadVenta) {
      return res.status(400).json({
        error: `No tienes suficientes activos en este portafolio. Tienes ${cantidadDisponible} unidades, necesitas ${cantidadVenta}.`
      });
    }

    // Obtener precio actual para verificar si la alerta ya se cumple
    const HistorialPreciosService = require('../services/historialPreciosService');
    const historialService = new HistorialPreciosService();
    const precioActual = await historialService.obtenerUltimoPrecio(activoId);
    
    const alerta = await Alerta.create({
      usuarioId: userId,
      portafolioId,
      activoId,
      precioObjetivo,
      cantidadVenta,
      condicion: condicion || 'mayor',
      activa: true
    });

    // Verificar si la alerta ya se cumple al momento de crearla
    if (precioActual) {
      const condicionCumplida = condicion === 'mayor' ?
        precioActual >= precioObjetivo :
        precioActual <= precioObjetivo;

      console.log(`Verificando condición al crear alerta ${alerta.id}:`, {
        precioActual,
        precioObjetivo,
        condicion,
        condicionCumplida
      });

      if (condicionCumplida) {
        console.log(`🚨 ALERTA CUMPLIDA AL CREAR: ID ${alerta.id} - Ejecutando venta inmediata`);
        
        try {
          const transaccionController = require('../controllers/transaccionController');
          const resultadoVenta = await transaccionController.ejecutarVentaAutomatica(
            userId,
            activoId,
            cantidadVenta,
            precioActual,
            portafolioId
          );

          // Actualizar estado de la alerta
          await alerta.update({
            estado: 'disparada',
            activa: false,
            fecha_disparo: new Date()
          });

          return res.status(201).json({
            alerta,
            mensaje: 'Alerta creada y ejecutada inmediatamente',
            venta_ejecutada: true,
            resultado_venta: resultadoVenta,
            precio_ejecucion: precioActual
          });

        } catch (ventaError) {
          console.error(`❌ Error al ejecutar venta inmediata:`, ventaError.message);
          
          // Cancelar la alerta si no se puede ejecutar
          await alerta.update({
            estado: 'cancelada',
            activa: false
          });

          return res.status(400).json({
            error: `Alerta creada pero no se pudo ejecutar la venta: ${ventaError.message}`
          });
        }
      }
    }
    
    return res.status(201).json({
      alerta,
      mensaje: 'Alerta creada exitosamente',
      venta_ejecutada: false
    });
  } catch (error) {
    console.error('Error al crear alerta:', error);
    return res.status(500).json({ message: 'Error al crear alerta', error: error.message });
  }
});

// Activar alerta
router.patch('/:id/activar', async (req, res) => {
  try {
    const { id } = req.params;
    const alerta = await Alerta.findByPk(id);
    
    if (!alerta) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }
    
    alerta.activa = true;
    await alerta.save();
    
    return res.json(alerta);
  } catch (error) {
    console.error('Error al activar alerta:', error);
    return res.status(500).json({ message: 'Error al activar alerta', error: error.message });
  }
});

// Desactivar alerta
router.patch('/:id/desactivar', async (req, res) => {
  try {
    const { id } = req.params;
    const alerta = await Alerta.findByPk(id);
    
    if (!alerta) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }
    
    alerta.activa = false;
    await alerta.save();
    
    return res.json(alerta);
  } catch (error) {
    console.error('Error al desactivar alerta:', error);
    return res.status(500).json({ message: 'Error al desactivar alerta', error: error.message });
  }
});

// Eliminar alerta
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const alerta = await Alerta.findByPk(id);
    
    if (!alerta) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }
    
    await alerta.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar alerta:', error);
    return res.status(500).json({ message: 'Error al eliminar alerta', error: error.message });
  }
});

module.exports = router;