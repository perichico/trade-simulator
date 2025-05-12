const { Activo, Dividendo, sequelize } = require("../models/index");
const { Op } = require("sequelize");

class GeneradorDividendosService {
    constructor() {
        // Intervalo de verificación para generar nuevos dividendos (por defecto: diario)
        this.INTERVALO_VERIFICACION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    }

    /**
     * Iniciar el servicio de generación automática de dividendos
     */
    iniciarServicio() {
        console.log('Iniciando servicio de generación automática de dividendos...');
        // Generar dividendos inmediatamente al iniciar
        this.generarDividendosProgramados();
        
        // Configurar intervalo para generar dividendos periódicamente
        setInterval(() => {
            this.generarDividendosProgramados();
        }, this.INTERVALO_VERIFICACION);
    }

    /**
     * Genera dividendos para todos los activos que tienen configuración de dividendos
     * y que corresponde generar según su frecuencia y última fecha de pago
     */
    async generarDividendosProgramados() {
        const transaction = await sequelize.transaction();
        
        try {
            console.log('Verificando activos para generar dividendos...');
            
            // Obtener todos los activos con configuración de dividendos
            const activosConDividendos = await Activo.findAll({
                where: {
                    porcentaje_dividendo: {
                        [Op.gt]: 0 // Porcentaje mayor que 0
                    },
                    frecuencia_dividendo: {
                        [Op.ne]: null // Frecuencia no nula
                    }
                }
            });
            
            if (activosConDividendos.length === 0) {
                console.log('No hay activos configurados para pagar dividendos');
                await transaction.commit();
                return;
            }
            
            console.log(`Verificando ${activosConDividendos.length} activos para generar dividendos...`);
            
            const fechaActual = new Date();
            let dividendosGenerados = 0;
            
            // Procesar cada activo
            for (const activo of activosConDividendos) {
                // Verificar si corresponde generar un dividendo según la frecuencia
                if (this.debeGenerarDividendo(activo, fechaActual)) {
                    await this.generarDividendo(activo, fechaActual, transaction);
                    dividendosGenerados++;
                }
            }
            
            await transaction.commit();
            console.log(`Se generaron ${dividendosGenerados} nuevos dividendos`);
        } catch (error) {
            await transaction.rollback();
            console.error("Error al generar dividendos programados:", error);
        }
    }

    /**
     * Determina si un activo debe generar un dividendo según su frecuencia y última fecha de pago
     * @param {Object} activo - El activo a verificar
     * @param {Date} fechaActual - La fecha actual
     * @returns {Boolean} - True si debe generar dividendo, False en caso contrario
     */
    debeGenerarDividendo(activo, fechaActual) {
        // Si no tiene fecha de último dividendo, generar uno
        if (!activo.ultima_fecha_dividendo) {
            return true;
        }
        
        const ultimaFecha = new Date(activo.ultima_fecha_dividendo);
        const diasTranscurridos = Math.floor((fechaActual - ultimaFecha) / (1000 * 60 * 60 * 24));
        
        // Determinar días necesarios según la frecuencia
        let diasNecesarios;
        switch (activo.frecuencia_dividendo) {
            case 'mensual':
                diasNecesarios = 30;
                break;
            case 'trimestral':
                diasNecesarios = 90;
                break;
            case 'semestral':
                diasNecesarios = 180;
                break;
            case 'anual':
                diasNecesarios = 365;
                break;
            default:
                return false;
        }
        
        return diasTranscurridos >= diasNecesarios;
    }

    /**
     * Genera un nuevo dividendo para un activo
     * @param {Object} activo - El activo para el que se generará el dividendo
     * @param {Date} fechaActual - La fecha actual
     * @param {Transaction} transaction - La transacción de Sequelize
     */
    async generarDividendo(activo, fechaActual, transaction) {
        try {
            // Calcular el monto del dividendo basado en el porcentaje y el precio actual
            const montoDividendo = (parseFloat(activo.ultimo_precio) * parseFloat(activo.porcentaje_dividendo)) / 100;
            
            // Calcular fecha de pago (7 días después de la fecha actual)
            const fechaPago = new Date(fechaActual);
            fechaPago.setDate(fechaPago.getDate() + 7);
            
            // Crear el dividendo
            await Dividendo.create({
                activo_id: activo.id,
                monto: montoDividendo,
                fecha_pago: fechaPago
            }, { transaction });
            
            // Actualizar la última fecha de dividendo del activo
            await Activo.update({
                ultima_fecha_dividendo: fechaActual
            }, {
                where: { id: activo.id },
                transaction
            });
            
            console.log(`Dividendo generado para ${activo.simbolo}: ${montoDividendo} programado para ${fechaPago}`);
        } catch (error) {
            console.error(`Error al generar dividendo para activo ${activo.id}:`, error);
            throw error;
        }
    }
}

module.exports = GeneradorDividendosService;