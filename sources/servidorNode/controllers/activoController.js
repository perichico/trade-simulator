const {sequelize, Usuario, Activo, Transaccion, TipoActivo} = require("../models/index");
const PreciosService = require('../services/preciosService');
const preciosService = new PreciosService();

// Obtener todos los activos con opción de filtrado por tipo
exports.obtenerActivos = async (req, res) => {
  try {
    const { tipo_activo_id } = req.query;
    const whereClause = tipo_activo_id ? { tipo_activo_id } : {};

    const activos = await Activo.findAll({
      where: whereClause,
      include: [{
        model: TipoActivo,
        attributes: ['nombre']
      }]
    });
    
    try {
      // Actualizar precios en tiempo real
      const actualizaciones = await preciosService.actualizarPreciosActivos(activos);
      // Actualizar los precios en la base de datos
      for (const actualizacion of actualizaciones) {
        if (actualizacion && actualizacion.ultimo_precio) {
          await Activo.update({
            ultima_actualizacion: actualizacion.ultima_actualizacion,
            ultimo_precio: actualizacion.ultimo_precio
            // La variación se calculará en tiempo real usando historial_precios
          }, {
            where: { id: actualizacion.id }
          });
        }
      }
      // Obtener los activos actualizados
      const activosActualizados = await Activo.findAll({
        where: whereClause,
        include: [{
          model: TipoActivo,
          attributes: ['nombre']
        }]
      });
      // Fusionar variación y último precio en la respuesta
      const activosConVariacion = activosActualizados.map(activo => {
        const actualizacion = actualizaciones.find(a => a.id === activo.id);
        return {
          ...activo.toJSON(),
          variacion: actualizacion ? actualizacion.variacion : 0,
          ultimo_precio: actualizacion ? actualizacion.ultimo_precio : activo.ultimo_precio,
          ultima_actualizacion: actualizacion ? actualizacion.ultima_actualizacion : activo.ultima_actualizacion
        };
      });
      res.status(200).json(activosConVariacion);
    } catch (precioError) {
      console.error('Error al actualizar precios:', precioError);
      // Si hay error al actualizar precios, devolver los activos sin actualizar
      res.status(200).json(activos);
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
    const activo = await Activo.findByPk(req.params.id, {
      include: [{
        model: TipoActivo,
        attributes: ['nombre']
      }]
    });
    if (!activo) return res.status(404).json({ error: "Activo no encontrado" });
    
    // Obtener precio en tiempo real
    const { precio: precio_actual } = await preciosService.obtenerPrecioActual(activo.simbolo, activo.id);
    if (precio_actual) {
      // Registrar el precio en el historial
      await preciosService.historialService.registrarPrecio(activo.id, precio_actual);
      
      // Calcular la variación usando el historial de precios
      const variacion = await preciosService.historialService.calcularVariacionPorcentual(activo.id, precio_actual);
      
      // Solo actualizamos la fecha de actualización, no el precio
      await activo.update({
        ultima_actualizacion: new Date()
      });
      
      // Asignamos el precio y variación para la respuesta, pero no lo guardamos en la tabla activos
      activo.dataValues.ultimo_precio = precio_actual;
      activo.dataValues.variacion = variacion;
    }
    
    res.json(activo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el activo" });
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
