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
        
        // Verificar que la tabla existe y su estructura antes de iniciar el servicio
        this.verificarTablaExiste()
            .then(async tablaExiste => {
                if (tablaExiste) {
                    // Verificar la estructura de la tabla
                    const { columnaFecha } = await this.verificarEstructuraTabla();
                    
                    if (!columnaFecha) {
                        console.error('No se pudo iniciar el servicio de dividendos: La estructura de la tabla dividendos no es compatible');
                        return;
                    }
                    
                    console.log(`Servicio de dividendos iniciado correctamente. Usando columna de fecha: ${columnaFecha}`);
                    
                    // Generar dividendos inmediatamente al iniciar
                    this.generarDividendosProgramados();
                    
                    // Configurar intervalo para generar dividendos periódicamente
                    setInterval(() => {
                        this.generarDividendosProgramados();
                    }, this.INTERVALO_VERIFICACION);
                } else {
                    console.error('No se pudo iniciar el servicio de dividendos: La tabla dividendos no existe');
                }
            })
            .catch(error => {
                console.error('Error al verificar la tabla de dividendos:', error);
            });
    }
    
    /**
     * Verifica si la tabla dividendos existe en la base de datos
     * @returns {Promise<boolean>} - True si la tabla existe, False en caso contrario
     */
    async verificarTablaExiste() {
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM information_schema.tables 
                WHERE table_schema = '${sequelize.config.database}' 
                AND table_name = 'dividendos'
            `;
            
            const [results] = await sequelize.query(query);
            return results[0]?.count > 0;
        } catch (error) {
            console.error('Error al verificar si existe la tabla dividendos:', error);
            return false;
        }
    }

    /**
     * Genera dividendos para todos los activos que tienen configuración de dividendos
     * y que corresponde generar según su frecuencia y última fecha de pago
     */
    async generarDividendosProgramados() {
        // Verificar primero si la tabla existe
        const tablaExiste = await this.verificarTablaExiste();
        if (!tablaExiste) {
            console.error('No se pueden generar dividendos: La tabla dividendos no existe');
            return;
        }
        
        // Verificar la estructura de la tabla para determinar el nombre correcto de la columna de fecha
        const { columnaFecha } = await this.verificarEstructuraTabla();
        if (!columnaFecha) {
            console.error('No se pueden generar dividendos: La estructura de la tabla dividendos no es compatible');
            return;
        }
        
        console.log(`Generando dividendos usando columna de fecha: ${columnaFecha}`);
        
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
                    try {
                        await this.generarDividendo(activo, fechaActual, transaction);
                        dividendosGenerados++;
                    } catch (error) {
                        console.error(`Error al generar dividendo para activo ${activo.id}:`, error);
                        // Continuamos con el siguiente activo sin interrumpir el proceso
                    }
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
    /**
     * Verifica la estructura de la tabla dividendos para determinar el nombre correcto de la columna de fecha
     * @returns {Promise<Object>} - Objeto con los nombres de columnas disponibles
     */
    async verificarEstructuraTabla() {
        try {
            const query = `
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = '${sequelize.config.database}' 
                AND TABLE_NAME = 'dividendos'
            `;
            
            const [columnas] = await sequelize.query(query);
            const nombresColumnas = columnas.map(col => col.COLUMN_NAME.toLowerCase());
            
            // Verificar qué columna de fecha existe
            const columnaFecha = nombresColumnas.includes('fecha') ? 'fecha' : 
                                 nombresColumnas.includes('fecha_pago') ? 'fecha_pago' : 
                                 nombresColumnas.includes('fecha_dividendo') ? 'fecha_dividendo' : null;
            
            console.log('Estructura de tabla dividendos:', nombresColumnas);
            console.log('Columna de fecha identificada:', columnaFecha);
            
            return {
                columnaFecha,
                nombresColumnas
            };
        } catch (error) {
            console.error('Error al verificar estructura de tabla dividendos:', error);
            return { columnaFecha: null, nombresColumnas: [] };
        }
    }

    async generarDividendo(activo, fechaActual, transaction) {
        try {
            // Verificar la estructura de la tabla para determinar el nombre correcto de la columna de fecha
            const { columnaFecha, nombresColumnas } = await this.verificarEstructuraTabla();
            
            if (!columnaFecha) {
                console.error('No se pudo identificar la columna de fecha en la tabla dividendos');
                console.error('Columnas disponibles:', nombresColumnas.join(', '));
                throw new Error('Estructura de tabla incompatible');
            }
            
            // Asegurarse de que los valores sean números válidos
            const ultimoPrecio = parseFloat(activo.ultimo_precio) || 0;
            const porcentajeDividendo = parseFloat(activo.porcentaje_dividendo) || 0;
            
            // Calcular el monto del dividendo basado en el porcentaje y el precio actual
            const montoDividendo = (ultimoPrecio * porcentajeDividendo) / 100;
            
            // Verificar que el monto sea un número válido
            if (isNaN(montoDividendo)) {
                console.error(`Error: Monto de dividendo inválido para activo ${activo.id}. Precio: ${ultimoPrecio}, Porcentaje: ${porcentajeDividendo}`);
                return; // No continuar si el monto no es válido
            }
            
            // Calcular fecha de pago (7 días después de la fecha actual)
            const fechaPago = new Date(fechaActual);
            fechaPago.setDate(fechaPago.getDate() + 7);
            
            // Formatear la fecha como YYYY-MM-DD para evitar problemas con el formato
            const fechaFormateada = fechaPago.toISOString().split('T')[0];
            
            // Crear el objeto de datos para el nuevo dividendo
            const dividendoData = {
                activo_id: activo.id,
                monto_por_accion: montoDividendo,
                estado: 'pendiente'
            };
            
            // Asignar la fecha usando el nombre de columna correcto
            dividendoData[columnaFecha] = fechaFormateada;
            
            // Crear el dividendo con todos los campos requeridos
            await Dividendo.create(dividendoData, { transaction });
            
            // Actualizar la última fecha de dividendo del activo
            await Activo.update({
                ultima_fecha_dividendo: fechaActual
            }, {
                where: { id: activo.id },
                transaction
            });
            
            console.log(`Dividendo generado para ${activo.simbolo}: ${montoDividendo} programado para ${fechaFormateada}`);
        } catch (error) {
            console.error(`Error al generar dividendo para activo ${activo.id}:`, error);
            throw error;
        }
    }
}

module.exports = GeneradorDividendosService;