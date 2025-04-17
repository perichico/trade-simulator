const {sequelize, Usuario, Activo, Transaccion} = require("../models/index");
const PreciosService = require('../services/preciosService');
const preciosService = new PreciosService();

// Obtener todos los activos
exports.obtenerActivos = async (req, res) => {
  try {
    const activos = await Activo.findAll();
    
    // Actualizar precios en tiempo real
    const actualizaciones = await preciosService.actualizarPreciosActivos(activos);
    
    // Actualizar los precios en la base de datos
    for (const actualizacion of actualizaciones) {
      await Activo.update({
        ultimo_precio: actualizacion.ultimo_precio,
        ultima_actualizacion: actualizacion.ultima_actualizacion
      }, {
        where: { id: actualizacion.id }
      });
    }

    // Obtener los activos actualizados
    const activosActualizados = await Activo.findAll();
    res.status(200).json(activosActualizados);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener los activos");
  }
};

// Crear un nuevo activo
exports.crearActivo = async (req, res) => {
  try {
    const { nombre, simbolo, tipo_activo_id } = req.body;
    
    // Obtener el precio inicial desde Google Finance
    const precio_inicial = await preciosService.obtenerPrecioActual(simbolo);
    
    const activo = await Activo.create({
      nombre,
      simbolo,
      tipo_activo_id,
      ultimo_precio: precio_inicial,
      ultima_actualizacion: new Date()
    });
    
    res.status(201).json(activo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el activo" });
  }
};

// Obtener un activo por ID
exports.obtenerActivoPorId = async (req, res) => {
  try {
    const activo = await Activo.findByPk(req.params.id);
    if (!activo) return res.status(404).json({ error: "Activo no encontrado" });
    
    // Actualizar precio en tiempo real
    const precio_actual = await preciosService.obtenerPrecioActual(activo.simbolo);
    await activo.update({
      ultimo_precio: precio_actual,
      ultima_actualizacion: new Date()
    });
    
    res.json(activo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el activo" });
  }
};

// Actualizar activo
exports.actualizarActivo = async (req, res) => {
    try {
        const activo = await Activo.findByPk(req.params.id);
        if (!activo) return res.status(404).json({ error: "Activo no encontrado" });

        await activo.update(req.body);
        res.json(activo);
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar el activo" });
    }
};

// Eliminar activo
exports.eliminarActivo = async (req, res) => {
    try {
        const activo = await Activo.findByPk(req.params.id);
        if (!activo) return res.status(404).json({ error: "Activo no encontrado" });

        await activo.destroy();
        res.json({ mensaje: "Activo eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el activo" });
    }
};
