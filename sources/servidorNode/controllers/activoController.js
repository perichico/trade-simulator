const {sequelize, Usuario, Activo, Transaccion} = require("../models/index");

// Obtener todos los activos
exports.obtenerActivos = async (req, res) => {
    try {
        const activos = await Activo.findAll();
        res.status(200).json(activos);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al obtener los activos");
    }
};

// Crear un nuevo activo
exports.crearActivo = async (req, res) => {
    try {
        const { nombre, simbolo, precio } = req.body;
        const activo = await Activo.create({ nombre, simbolo, precio });
        res.status(201).json(activo);
    } catch (error) {
        res.status(500).json({ error: "Error al crear el activo" });
    }
};

// Obtener un activo por ID
exports.obtenerActivoPorId = async (req, res) => {
    try {
        const activo = await Activo.findByPk(req.params.id);
        if (!activo) return res.status(404).json({ error: "Activo no encontrado" });
        res.json(activo);
    } catch (error) {
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
