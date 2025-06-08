const { HistorialPrecios, Op } = require('../models/index');

class HistorialPreciosService {
    constructor() {
        this.INTERVALO_REGISTRO = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    }

    async obtenerUltimoPrecio(activoId) {
        try {
            const { HistorialPrecios, Activo } = require('../models/index');
            
            // Primero intentar obtener el último precio del historial
            const ultimoRegistro = await HistorialPrecios.findOne({
                where: { activo_id: activoId },
                order: [['fecha', 'DESC']],
                limit: 1
            });

            if (ultimoRegistro) {
                console.log(`Precio del historial para activo ${activoId}: $${ultimoRegistro.precio}`);
                return parseFloat(ultimoRegistro.precio);
            }

            // Si no hay historial, obtener precio del activo
            const activo = await Activo.findByPk(activoId);
            if (activo && activo.ultimo_precio) {
                console.log(`Precio del activo ${activoId}: $${activo.ultimo_precio}`);
                return parseFloat(activo.ultimo_precio);
            }

            console.log(`No se encontró precio para activo ${activoId}`);
            return null;
        } catch (error) {
            console.error(`Error al obtener último precio para activo ${activoId}:`, error);
            return null;
        }
    }

    async calcularVariacionPorcentual(activoId, precioActual) {
        try {
            if (!precioActual || precioActual <= 0) {
                console.log('Precio actual no válido para calcular variación');
                return 0;
            }

            // Obtener los últimos 2 registros distintos de precio
            const ultimosRegistros = await HistorialPrecios.findAll({
                where: { activo_id: activoId },
                order: [['fecha', 'DESC']],
                limit: 10, // Obtener más registros para encontrar precios diferentes
                raw: true
            });
            
            if (ultimosRegistros.length < 2) {
                console.log(`Insuficientes registros históricos para activo ${activoId}`);
                return 0;
            }
            
            // Buscar el primer precio diferente al actual (tolerancia de 0.01)
            let precioAnterior = null;
            for (let i = 1; i < ultimosRegistros.length; i++) {
                const precio = parseFloat(ultimosRegistros[i].precio);
                if (Math.abs(precio - precioActual) > 0.01) {
                    precioAnterior = precio;
                    break;
                }
            }
            
            if (!precioAnterior || precioAnterior <= 0) {
                console.log(`No se encontró precio anterior válido para activo ${activoId}`);
                return 0;
            }
            
            const variacion = ((precioActual - precioAnterior) / precioAnterior) * 100;
            const variacionRedondeada = parseFloat(variacion.toFixed(2));
            
            console.log(`Variación calculada para activo ${activoId}: ${variacionRedondeada}% (Actual: ${precioActual}, Anterior: ${precioAnterior})`);
            return variacionRedondeada;
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