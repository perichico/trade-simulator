const { Activo, Dividendo } = require('../models/index');
const DividendoService = require('../services/dividendoService');

const dividendoService = new DividendoService();

// Obtener todos los dividendos
exports.obtenerDividendos = async (req, res) => {
  try {
    const dividendos = await Dividendo.findAll({
      include: [{ model: Activo }],
      order: [["fecha", "DESC"]]
    });
    
    res.status(200).json(dividendos);
  } catch (error) {
    console.error('Error al obtener dividendos:', error);
    res.status(500).json({ error: "Error al obtener dividendos" });
  }
};

// Obtener dividendos de un usuario específico
exports.obtenerDividendosPorUsuario = async (req, res) => {
  try {
    console.log('=== INICIO - Solicitud de dividendos por usuario ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Origin:', req.headers.origin);
    console.log('Referer:', req.headers.referer);
    console.log('Session ID:', req.sessionID);
    
    // Verificar si hay sesión
    if (!req.session) {
      console.log('ERROR: No hay objeto session en la request');
      return res.status(401).json({ 
        error: "Sesión no disponible",
        tipo: "SESION_NO_DISPONIBLE",
        mensaje: "No se pudo acceder a la información de sesión",
        debug: {
          sessionExists: false,
          sessionKeys: 'N/A'
        }
      });
    }

    console.log('Session keys disponibles:', Object.keys(req.session));
    console.log('Session data:', JSON.stringify({
      ...req.session,
      // No mostrar datos sensibles
      cookie: req.session.cookie ? 'exists' : 'missing'
    }, null, 2));

    // Verificar si el usuario está autenticado
    if (!req.session.usuario) {
      console.log('ERROR: Usuario no autenticado - session.usuario no existe');
      return res.status(401).json({ 
        error: "Usuario no autenticado",
        tipo: "USUARIO_NO_AUTENTICADO",
        mensaje: "Debes iniciar sesión para ver tus dividendos",
        debug: {
          sessionExists: true,
          sessionKeys: Object.keys(req.session),
          usuarioExists: false
        }
      });
    }

    // Verificar si el usuario está suspendido
    if (req.session.usuario.estado === 'suspendido') {
      console.log(`Usuario suspendido intentando acceder: ${req.session.usuario.id}`);
      return res.status(403).json({ 
        error: "Usuario suspendido",
        tipo: "USUARIO_SUSPENDIDO",
        mensaje: "Tu cuenta ha sido suspendida. Contacta al administrador para más información."
      });
    }

    // Verificar que tenemos el ID del usuario
    if (!req.session.usuario.id) {
      console.log('ERROR: Usuario autenticado pero sin ID');
      console.log('Usuario object completo:', JSON.stringify(req.session.usuario, null, 2));
      return res.status(400).json({ 
        error: "Datos de usuario incompletos",
        tipo: "USUARIO_SIN_ID",
        mensaje: "Los datos del usuario están incompletos",
        debug: {
          usuarioKeys: Object.keys(req.session.usuario || {}),
          usuarioData: req.session.usuario
        }
      });
    }

    const usuarioId = req.session.usuario.id;
    console.log(`✓ Usuario autenticado correctamente - ID: ${usuarioId}`);
    console.log(`✓ Nombre: ${req.session.usuario.nombre || 'No especificado'}`);
    console.log(`✓ Email: ${req.session.usuario.email || 'No especificado'}`);
    console.log(`✓ Estado: ${req.session.usuario.estado || 'No especificado'}`);
    console.log(`✓ Rol: ${req.session.usuario.rol || 'No especificado'}`);
    
    console.log('Llamando al servicio de dividendos...');
    const dividendos = await dividendoService.obtenerDividendosPorUsuario(usuarioId);
    
    console.log(`✓ Servicio completado - Se obtuvieron ${dividendos.length} dividendos`);
    
    if (dividendos.length > 0) {
      console.log('Primeros 3 dividendos:', dividendos.slice(0, 3));
    }
    
    console.log('=== FIN - Solicitud completada exitosamente ===');
    
    res.status(200).json({
      success: true,
      data: dividendos,
      total: dividendos.length,
      usuario: {
        id: usuarioId,
        nombre: req.session.usuario.nombre
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.log('=== ERROR CAPTURADO EN CONTROLADOR ===');
    console.error('Error completo:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      sessionExists: !!req.session,
      userExists: !!req.session?.usuario,
      userId: req.session?.usuario?.id || 'No ID'
    });
    
    // Determinar el tipo de error y responder apropiadamente
    let statusCode = 500;
    let errorResponse = {
      error: "Error interno del servidor",
      tipo: "ERROR_INTERNO",
      mensaje: "Ha ocurrido un error inesperado al obtener los dividendos",
      timestamp: new Date().toISOString(),
      debug: {
        originalError: error.message,
        sessionValid: !!req.session?.usuario?.id
      }
    };

    // Si es un error de base de datos
    if (error.name === 'SequelizeError' || error.name === 'SequelizeDatabaseError') {
      errorResponse.tipo = "ERROR_BASE_DATOS";
      errorResponse.mensaje = "Error al consultar la base de datos";
    }
    
    // Si es un error de validación
    if (error.message.includes('Usuario') || error.message.includes('dividendos')) {
      statusCode = 400;
      errorResponse.tipo = "ERROR_VALIDACION";
      errorResponse.mensaje = error.message;
    }

    console.log('=== RESPUESTA DE ERROR ===');
    console.log('Status:', statusCode);
    console.log('Response:', JSON.stringify(errorResponse, null, 2));
    
    res.status(statusCode).json(errorResponse);
  }
};

// Crear un nuevo dividendo (funcionalidad de admin)
exports.crearDividendo = async (req, res) => {
  try {
    // Verificar permisos de admin
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Permisos insuficientes. Se requiere rol de administrador.' });
    }

    const { activo_id, monto_por_accion, fecha } = req.body;

    if (!activo_id || !monto_por_accion) {
      return res.status(400).json({ error: 'Faltan datos requeridos: activo_id y monto_por_accion' });
    }

    // Verificar que el activo existe
    const activo = await Activo.findByPk(activo_id);
    if (!activo) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }

    const nuevoDividendo = await Dividendo.create({
      activo_id,
      monto_por_accion,
      fecha: fecha || new Date(),
      estado: 'pendiente'
    });

    res.status(201).json({
      mensaje: 'Dividendo creado correctamente',
      dividendo: nuevoDividendo
    });
  } catch (error) {
    console.error('Error al crear dividendo:', error);
    res.status(500).json({ error: 'Error al crear dividendo' });
  }
};

// Procesar dividendos pendientes (funcionalidad de admin)
exports.procesarDividendosPendientes = async (req, res) => {
  try {
    // Verificar permisos de admin
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Permisos insuficientes. Se requiere rol de administrador.' });
    }

    const dividendos = await dividendoService.procesarDividendosPendientes();
    res.status(200).json({
      mensaje: `Se han procesado ${dividendos.length} dividendos pendientes`,
      dividendos
    });
  } catch (error) {
    console.error('Error al procesar dividendos pendientes:', error);
    res.status(500).json({ error: 'Error al procesar dividendos pendientes' });
  }
};

// Procesar dividendos automáticos
exports.procesarDividendosAutomaticos = async (req, res) => {
  try {
    const dividendos = await dividendoService.procesarDividendosAutomaticos();
    res.status(200).json({
      mensaje: `Se han procesado ${dividendos.length} dividendos automáticos`,
      dividendos
    });
  } catch (error) {
    console.error('Error al procesar dividendos automáticos:', error);
    res.status(500).json({ error: "Error al procesar dividendos automáticos" });
  }
};

// Marcar dividendo como pagado (funcionalidad de admin)
exports.marcarDividendoComoPagado = async (req, res) => {
  try {
    // Verificar permisos de admin
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Permisos insuficientes. Se requiere rol de administrador.' });
    }

    const dividendoId = req.params.id;

    // Buscar el dividendo
    const dividendo = await Dividendo.findByPk(dividendoId, {
      include: [{ model: Activo }]
    });

    if (!dividendo) {
      return res.status(404).json({ error: 'Dividendo no encontrado' });
    }

    if (dividendo.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden marcar como pagados los dividendos pendientes' });
    }

    // Procesar el pago del dividendo ANTES de actualizar el estado
    const resultadoPago = await dividendoService.procesarPagoDividendo(dividendo);

    // Actualizar solo el estado (no incluir fecha_pago)
    await dividendo.update({ 
      estado: 'pagado'
    });

    res.status(200).json({
      mensaje: `Dividendo marcado como pagado. Se procesaron ${resultadoPago.totalPagado}€ para ${resultadoPago.usuariosAfectados} portafolios.`,
      dividendo: dividendo,
      estadisticas: resultadoPago
    });
  } catch (error) {
    console.error('Error al marcar dividendo como pagado:', error);
    res.status(500).json({ error: 'Error al marcar dividendo como pagado: ' + error.message });
  }
};

// Cancelar dividendo (funcionalidad de admin)
exports.cancelarDividendo = async (req, res) => {
  try {
    // Verificar permisos de admin
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Permisos insuficientes. Se requiere rol de administrador.' });
    }

    const dividendoId = req.params.id;

    // Buscar el dividendo
    const dividendo = await Dividendo.findByPk(dividendoId, {
      include: [{ model: Activo }]
    });

    if (!dividendo) {
      return res.status(404).json({ error: 'Dividendo no encontrado' });
    }

    if (dividendo.estado === 'pagado') {
      return res.status(400).json({ error: 'No se puede cancelar un dividendo ya pagado' });
    }

    // Actualizar estado a cancelado
    await dividendo.update({ estado: 'cancelado' });

    res.status(200).json({
      mensaje: 'Dividendo cancelado correctamente',
      dividendo: dividendo
    });
  } catch (error) {
    console.error('Error al cancelar dividendo:', error);
    res.status(500).json({ error: 'Error al cancelar dividendo' });
  }
};

// Obtener detalles completos de un dividendo (funcionalidad de admin)
exports.obtenerDetallesDividendo = async (req, res) => {
  try {
    // Verificar permisos de admin
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Permisos insuficientes. Se requiere rol de administrador.' });
    }

    const dividendoId = req.params.id;

    // Buscar el dividendo con información detallada
    const dividendo = await Dividendo.findByPk(dividendoId, {
      include: [{ model: Activo }]
    });

    if (!dividendo) {
      return res.status(404).json({ error: 'Dividendo no encontrado' });
    }

    // Obtener estadísticas adicionales del dividendo
    const estadisticas = await dividendoService.obtenerEstadisticasDividendo(dividendoId);

    res.status(200).json({
      dividendo: dividendo,
      estadisticas: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener detalles del dividendo:', error);
    res.status(500).json({ error: 'Error al obtener detalles del dividendo' });
  }
};