const { HistorialPrecios } = require('../models/index');
const HistorialPreciosService = require('../services/historialPreciosService');

const historialService = new HistorialPreciosService();

// Obtener historial de precios de un activo
exports.obtenerHistorialPrecios = async (req, res) => {
    try {
        const { activoId } = req.params;
        const { fechaInicio, fechaFin } = req.query;

        if (!activoId) {
            return res.status(400).json({ error: "Se requiere el ID del activo" });
        }

        // Si no se proporcionan fechas, usar último mes por defecto
        const fechaFinParsed = fechaFin ? new Date(fechaFin) : new Date();
        const fechaInicioParsed = fechaInicio 
            ? new Date(fechaInicio)
            : new Date(fechaFinParsed.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 días atrás

        const historial = await historialService.obtenerHistorialPrecios(
            activoId,
            fechaInicioParsed,
            fechaFinParsed
        );

        res.json(historial);
    } catch (error) {
        console.error('Error al obtener historial de precios:', error);
        res.status(500).json({ error: "Error al obtener historial de precios" });
    }
};