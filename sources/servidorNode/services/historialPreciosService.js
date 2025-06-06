const { HistorialPrecios, Op } = require('../models/index');

class HistorialPreciosService {
    constructor() {
        this.INTERVALO_REGISTRO = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    }

    async obtenerUltimoPrecio(activoId) {
        try {
            const ultimosRegistros = await HistorialPrecios.findAll({
                where: { activo_id: activoId },
                order: [['fecha', 'DESC']],
                limit: 2,
                raw: true
            });
            
            if (ultimosRegistros.length === 0) {
                console.log(`No se encontró historial de precios para el activo ${activoId}`);
                return null;
            }
            
            // Si solo hay un registro o si los dos últimos registros son iguales, usar el último
            if (ultimosRegistros.length === 1 || ultimosRegistros[0].precio === ultimosRegistros[1].precio) {
                console.log(`Último precio encontrado para activo ${activoId}: ${ultimosRegistros[0].precio}`);
                return ultimosRegistros[0].precio;
            }
            
            // Usar el penúltimo registro para calcular la variación
            console.log(`Penúltimo precio encontrado para activo ${activoId}: ${ultimosRegistros[1].precio}`);
            return ultimosRegistros[1].precio;
        } catch (error) {
            console.error('Error al obtener último precio:', error);
            throw error;
        }
    }

    async calcularVariacionPorcentual(activoId, precioActual) {
        try {
            if (!precioActual) {
                console.log('Precio actual no proporcionado');
                return 0;
            }

            const ultimosRegistros = await HistorialPrecios.findAll({
                where: { activo_id: activoId },
                order: [['fecha', 'DESC']],
                limit: 2,
                raw: true
            });
            
            if (ultimosRegistros.length < 2) {
                console.log(`No hay suficientes registros para calcular variación para el activo ${activoId}`);
                return 0;
            }
            
            const penultimoPrecio = ultimosRegistros[1].precio;
            
            if (precioActual === penultimoPrecio) {
                console.log(`No hay variación en el precio para el activo ${activoId}`);
                return 0;
            }
            
            const variacion = ((precioActual - penultimoPrecio) / penultimoPrecio) * 100;
            console.log(`Variación calculada para activo ${activoId}: ${variacion.toFixed(2)}% (Precio actual: ${precioActual}, Penúltimo precio: ${penultimoPrecio})`);
            return parseFloat(variacion.toFixed(2));
        } catch (error) {
            console.error('Error al calcular variación porcentual:', error);
            return 0;
        }
    }

    async registrarPrecio(activoId, precio) {
        try {
            // Verificar si hay alertas activas para este activo
            const { Alerta } = require('../models/index');
            const alertasActivas = await Alerta.findAll({
                where: { 
                    activo_id: activoId,
                    estado: 'activa',
                    activa: true
                }
            });

            // Si hay alertas activas, registrar más frecuentemente (cada minuto)
            // Si no hay alertas, usar el intervalo normal (5 minutos)
            const intervaloMinutos = alertasActivas.length > 0 ? 1 : 5;
            const intervaloAtras = new Date(Date.now() - intervaloMinutos * 60 * 1000);
            
            const registroReciente = await HistorialPrecios.findOne({
                where: {
                    activo_id: activoId,
                    fecha: {
                        [Op.gte]: intervaloAtras
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
                
                console.log(`Precio registrado para activo ${activoId}: $${precio} (${alertasActivas.length} alertas activas)`);
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