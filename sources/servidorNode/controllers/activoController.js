const { sequelize, Usuario, Activo, Transaccion, TipoActivo } = require("../models/index");
const PreciosService = require('../services/preciosService');
const HistorialPreciosService = require('../services/historialPreciosService');
const preciosService = new PreciosService();
const historialPreciosService = new HistorialPreciosService();

// Obtener todos los activos con opción de filtrado por tipo
exports.obtenerActivos = async (req, res) => {
  try {
    const { tipo_activo_id } = req.query;
    const whereClause = tipo_activo_id ? { tipo_activo_id } : {};

    console.log('Consultando activos con whereClause:', whereClause);

    const activos = await Activo.findAll({
      where: whereClause,
      include: [{
        model: TipoActivo,
        attributes: ['id', 'nombre'],
        required: false
      }],
      order: [['id', 'ASC']]
    });
    
    console.log(`Activos encontrados en base de datos: ${activos.length}`);
    
    try {
      // Actualizar precios en tiempo real
      const actualizaciones = await preciosService.actualizarPreciosActivos(activos);
      
      // Actualizar los precios en la base de datos y calcular variaciones
      const activosFormateados = [];
      
      for (let i = 0; i < activos.length; i++) {
        const activo = activos[i];
        const actualizacion = actualizaciones[i];
        
        let variacion = 0;
        let precioActualizado = parseFloat(activo.ultimo_precio) || 0;
        
        if (actualizacion && actualizacion.ultimo_precio) {
          precioActualizado = parseFloat(actualizacion.ultimo_precio);
          
          // Actualizar precio en BD
          await Activo.update({
            ultima_actualizacion: actualizacion.ultima_actualizacion,
            ultimo_precio: precioActualizado
          }, {
            where: { id: activo.id }
          });
          
          // Calcular variación usando el servicio de historial
          variacion = await historialPreciosService.calcularVariacionPorcentual(activo.id, precioActualizado);
        }
        
        // Formatear respuesta
        activosFormateados.push({
          id: activo.id,
          nombre: activo.nombre,
          simbolo: activo.simbolo,
          ultimo_precio: precioActualizado,
          ultima_actualizacion: actualizacion?.ultima_actualizacion || activo.ultima_actualizacion,
          tipo_activo_id: activo.tipo_activo_id,
          tipoActivo: activo.TipoActivo ? {
            id: activo.TipoActivo.id,
            nombre: activo.TipoActivo.nombre
          } : { id: 1, nombre: 'Acción' },
          porcentaje_dividendo: activo.porcentaje_dividendo || 0,
          frecuencia_dividendo: activo.frecuencia_dividendo || 'trimestral',
          variacion: variacion
        });
      }
      
      console.log('Enviando activos con variaciones calculadas:', activosFormateados.length);
      res.json(activosFormateados);
      
    } catch (precioError) {
      console.error('Error al actualizar precios:', precioError);
      // En caso de error, enviar activos con variación 0
      const activosSinVariacion = activos.map(activo => ({
        id: activo.id,
        nombre: activo.nombre,
        simbolo: activo.simbolo,
        ultimo_precio: parseFloat(activo.ultimo_precio) || 0,
        ultima_actualizacion: activo.ultima_actualizacion,
        tipo_activo_id: activo.tipo_activo_id,
        tipoActivo: activo.TipoActivo ? {
          id: activo.TipoActivo.id,
          nombre: activo.TipoActivo.nombre
        } : { id: 1, nombre: 'Acción' },
        porcentaje_dividendo: activo.porcentaje_dividendo || 0,
        frecuencia_dividendo: activo.frecuencia_dividendo || 'trimestral',
        variacion: 0
      }));
      res.status(200).json(activosSinVariacion);
    }
  } catch (error) {
    console.error('Error al obtener los activos:', error);
    res.status(500).json({ error: "Error al obtener los activos" });
  }
};

// Crear un nuevo activo
exports.crearActivo = async (req, res) => {
  try {
    const { nombre, simbolo, tipo_activo_id } = req.body;
    
    if (!nombre || !simbolo || !tipo_activo_id) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }
    
    // Obtener el precio inicial
    const precio_inicial = await preciosService.obtenerPrecioActual(simbolo);
    
    if (!precio_inicial) {
      return res.status(400).json({ error: "No se pudo obtener el precio inicial del activo" });
    }
    
    const activo = await Activo.create({
      nombre,
      simbolo,
      tipo_activo_id,
      ultimo_precio: precio_inicial,
      ultima_actualizacion: new Date()
    });
    
    res.status(201).json(activo);
  } catch (error) {
    console.error('Error al crear el activo:', error);
    res.status(500).json({ error: "Error al crear el activo" });
  }
};

// Obtener un activo por ID
exports.obtenerActivoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Buscando activo con ID:', id);
    
    // Validar que el ID sea un número válido
    if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
      console.log('ID de activo inválido:', id);
      return res.status(400).json({ error: 'ID de activo inválido' });
    }
    
    const activoId = parseInt(id);
    
    const activo = await Activo.findByPk(activoId, {
      include: [{
        model: TipoActivo,
        attributes: ['id', 'nombre']
      }]
    });
    
    if (!activo) {
      console.log('Activo no encontrado con ID:', activoId);
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    
    // Verificar que el ID del activo encontrado coincida con el solicitado
    if (activo.id !== activoId) {
      console.error(`Inconsistencia de ID: solicitado ${activoId}, encontrado ${activo.id}`);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    try {
      // Actualizar precio y calcular variación para este activo específico
      const actualizacion = await preciosService.actualizarPreciosActivos([activo]);
      
      let precioActualizado = parseFloat(activo.ultimo_precio) || 0;
      let variacion = 0;
      
      if (actualizacion && actualizacion.length > 0 && actualizacion[0]) {
        const datosActualizados = actualizacion[0];
        precioActualizado = parseFloat(datosActualizados.ultimo_precio) || precioActualizado;
        
        // Actualizar en la base de datos
        await Activo.update({
          ultima_actualizacion: datosActualizados.ultima_actualizacion,
          ultimo_precio: precioActualizado
        }, {
          where: { id: activoId }
        });
      }
      
      // Calcular variación independientemente del éxito de la actualización
      variacion = await historialPreciosService.calcularVariacionPorcentual(activoId, precioActualizado);
      
      // Devolver el activo con la variación calculada
      const activoConVariacion = {
        ...activo.toJSON(),
        variacion: variacion,
        ultimo_precio: precioActualizado,
        ultima_actualizacion: actualizacion?.[0]?.ultima_actualizacion || activo.ultima_actualizacion
      };
      
      console.log(`Activo ${activoId} con variación: ${variacion}%`);
      res.status(200).json(activoConVariacion);
      
    } catch (precioError) {
      console.error('Error al actualizar precio del activo:', precioError);
      
      // Aún así intentar calcular variación con el precio actual
      let variacion = 0;
      try {
        variacion = await historialPreciosService.calcularVariacionPorcentual(activoId, parseFloat(activo.ultimo_precio));
      } catch (variacionError) {
        console.error('Error al calcular variación:', variacionError);
      }
      
      const activoConVariacion = {
        ...activo.toJSON(),
        variacion: variacion
      };
      res.status(200).json(activoConVariacion);
    }
    
  } catch (error) {
    console.error('Error detallado al obtener el activo:', error);
    res.status(500).json({ 
      error: "Error al obtener el activo",
      details: error.message 
    });
  }
};

// Actualizar activo
exports.actualizarActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      simbolo, 
      tipo_activo_id, 
      porcentaje_dividendo, 
      frecuencia_dividendo, 
      ultima_fecha_dividendo 
    } = req.body;

    const activo = await Activo.findByPk(id);
    if (!activo) {
      return res.status(404).json({ mensaje: "Activo no encontrado" });
    }

    await activo.update({ 
      nombre, 
      simbolo, 
      tipo_activo_id,
      porcentaje_dividendo,
      frecuencia_dividendo,
      ultima_fecha_dividendo: ultima_fecha_dividendo ? new Date(ultima_fecha_dividendo) : activo.ultima_fecha_dividendo
    });
    res.status(200).json(activo);
  } catch (error) {
    console.error("Error al actualizar activo:", error);
    res.status(500).json({ mensaje: "Error al actualizar activo", error: error.message });
  }
};

// Eliminar activo
exports.eliminarActivo = async (req, res) => {
    try {
        const activo = await Activo.findByPk(req.params.id, {
      include: [{
        model: TipoActivo,
        attributes: ['nombre']
      }]
    });
        if (!activo) return res.status(404).json({ error: "Activo no encontrado" });

        await activo.destroy();
        res.json({ mensaje: "Activo eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el activo" });
    }
};
