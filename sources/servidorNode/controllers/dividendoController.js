const DividendoService = require('../services/dividendoService');
const { Dividendo, Activo } = require('../models/index');

// Crear una instancia del servicio
const dividendoService = new DividendoService();

// Obtener dividendos por usuario
async function obtenerDividendosPorUsuario(req, res) {
  try {
    console.log('📊 Obteniendo dividendos para usuario:', req.session.usuario.id);
    
    const usuarioId = req.session.usuario.id;
    
    if (!usuarioId) {
      return res.status(400).json({
        error: 'ID de usuario requerido',
        mensaje: 'No se pudo identificar al usuario'
      });
    }

    const dividendos = await dividendoService.obtenerDividendosPorUsuario(usuarioId);
    
    console.log(`✅ Dividendos obtenidos: ${dividendos.length}`);
    
    res.json({
      success: true,
      data: dividendos,
      total: dividendos.length
    });

  } catch (error) {
    console.error('❌ Error en obtenerDividendosPorUsuario:', error);
    
    res.status(500).json({
      error: 'Error interno del servidor',
      tipo: 'ERROR_INTERNO',
      mensaje: 'Ha ocurrido un error inesperado al obtener los dividendos',
      timestamp: new Date().toISOString(),
      debug: {
        originalError: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
}

// Obtener todos los dividendos (admin)
async function obtenerDividendos(req, res) {
  try {
    const dividendos = await Dividendo.findAll({
      include: [{ 
        model: Activo,
        as: 'activo'
      }],
      order: [['fecha', 'DESC']]
    });

    res.json({
      success: true,
      data: dividendos
    });

  } catch (error) {
    console.error('Error al obtener dividendos:', error);
    res.status(500).json({
      error: 'Error al obtener dividendos',
      mensaje: error.message
    });
  }
}

// Crear dividendo
async function crearDividendo(req, res) {
  try {
    const { activo_id, monto_por_accion } = req.body;

    if (!activo_id || !monto_por_accion) {
      return res.status(400).json({
        error: 'Datos requeridos faltantes',
        mensaje: 'Se requiere activo_id y monto_por_accion'
      });
    }

    const nuevoDividendo = await Dividendo.create({
      activo_id,
      fecha: new Date(),
      monto_por_accion,
      estado: 'pendiente'
    });

    res.status(201).json({
      success: true,
      data: nuevoDividendo,
      mensaje: 'Dividendo creado exitosamente'
    });

  } catch (error) {
    console.error('Error al crear dividendo:', error);
    res.status(500).json({
      error: 'Error al crear dividendo',
      mensaje: error.message
    });
  }
}

// Procesar dividendos automáticos
async function procesarDividendosAutomaticos(req, res) {
  try {
    console.log('🤖 Iniciando procesamiento automático de dividendos...');
    
    const dividendosCreados = await dividendoService.procesarDividendosAutomaticos();
    
    res.json({
      success: true,
      data: dividendosCreados,
      mensaje: `Se procesaron ${dividendosCreados.length} dividendos automáticamente`,
      total: dividendosCreados.length
    });

  } catch (error) {
    console.error('Error al procesar dividendos automáticos:', error);
    res.status(500).json({
      error: 'Error al procesar dividendos automáticos',
      mensaje: error.message
    });
  }
}

// Procesar dividendos pendientes
async function procesarDividendosPendientes(req, res) {
  try {
    console.log('⏳ Procesando dividendos pendientes...');
    
    const dividendosProcesados = await dividendoService.procesarDividendosPendientes();
    
    res.json({
      success: true,
      data: dividendosProcesados,
      mensaje: `Se procesaron ${dividendosProcesados.length} dividendos pendientes`,
      total: dividendosProcesados.length
    });

  } catch (error) {
    console.error('Error al procesar dividendos pendientes:', error);
    res.status(500).json({
      error: 'Error al procesar dividendos pendientes',
      mensaje: error.message
    });
  }
}

// Marcar dividendo como pagado
async function marcarDividendoComoPagado(req, res) {
  try {
    const { id } = req.params;
    
    const dividendo = await Dividendo.findByPk(id);
    
    if (!dividendo) {
      return res.status(404).json({
        error: 'Dividendo no encontrado',
        mensaje: 'El dividendo especificado no existe'
      });
    }

    await dividendo.update({ estado: 'pagado' });
    
    // Procesar el pago
    const resultado = await dividendoService.procesarPagoDividendo(dividendo);

    res.json({
      success: true,
      data: dividendo,
      estadisticas: resultado,
      mensaje: 'Dividendo marcado como pagado y procesado'
    });

  } catch (error) {
    console.error('Error al marcar dividendo como pagado:', error);
    res.status(500).json({
      error: 'Error al procesar dividendo',
      mensaje: error.message
    });
  }
}

// Cancelar dividendo
async function cancelarDividendo(req, res) {
  try {
    const { id } = req.params;
    
    const dividendo = await Dividendo.findByPk(id);
    
    if (!dividendo) {
      return res.status(404).json({
        error: 'Dividendo no encontrado',
        mensaje: 'El dividendo especificado no existe'
      });
    }

    await dividendo.update({ estado: 'cancelado' });

    res.json({
      success: true,
      data: dividendo,
      mensaje: 'Dividendo cancelado exitosamente'
    });

  } catch (error) {
    console.error('Error al cancelar dividendo:', error);
    res.status(500).json({
      error: 'Error al cancelar dividendo',
      mensaje: error.message
    });
  }
}

// Obtener detalles de un dividendo
async function obtenerDetallesDividendo(req, res) {
  try {
    const { id } = req.params;
    
    const dividendo = await Dividendo.findByPk(id, {
      include: [{ 
        model: Activo,
        as: 'activo'
      }]
    });
    
    if (!dividendo) {
      return res.status(404).json({
        error: 'Dividendo no encontrado',
        mensaje: 'El dividendo especificado no existe'
      });
    }

    const estadisticas = await dividendoService.obtenerEstadisticasDividendo(id);

    res.json({
      success: true,
      data: {
        dividendo,
        estadisticas
      }
    });

  } catch (error) {
    console.error('Error al obtener detalles del dividendo:', error);
    res.status(500).json({
      error: 'Error al obtener detalles del dividendo',
      mensaje: error.message
    });
  }
}

module.exports = {
  obtenerDividendosPorUsuario,
  obtenerDividendos,
  crearDividendo,
  procesarDividendosAutomaticos,
  procesarDividendosPendientes,
  marcarDividendoComoPagado,
  cancelarDividendo,
  obtenerDetallesDividendo
};