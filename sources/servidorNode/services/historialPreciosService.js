const { HistorialPrecios, Op } = require('../models/index');

class HistorialPreciosService {
    constructor() {
        this.INTERVALO_REGISTRO = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    }

    async registrarPrecio(activoId, precio) {
        try {
            // Verificar si existe un registro en los últimos 5 minutos
            const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);
            
            const registroReciente = await HistorialPrecios.findOne({
                where: {
                    activo_id: activoId,
                    fecha: {
                        [Op.gte]: cincoMinutosAtras
                    }
                },
                order: [['fecha', 'DESC']]
            });

            // Solo crear un nuevo registro si no existe uno reciente
            if (!registroReciente) {
                await HistorialPrecios.create({
                    activo_id: activoId,
                    precio: precio,
                    fecha: new Date()
                });
            }
        } catch (error) {
            console.error('Error al registrar precio en historial:', error);
            throw error;
        }
    }

    async obtenerHistorialPrecios(activoId, fechaInicio, fechaFin) {
        try {
            return await HistorialPrecios.findAll({
                where: {
                    activo_id: activoId,
                    fecha: {
                        [Op.between]: [fechaInicio, fechaFin]
                    }
                },
                order: [['fecha', 'ASC']]
            });
        } catch (error) {
            console.error('Error al obtener historial de precios:', error);
            throw error;
        }
    }
}

module.exports = HistorialPreciosService;