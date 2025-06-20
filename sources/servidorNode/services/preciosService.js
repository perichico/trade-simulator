const HistorialPreciosService = require('./historialPreciosService');

class PreciosService {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos
        this.VOLATILIDAD = 0.05; // 0.5% de volatilidad máxima (reducida de 2%)
        this.TENDENCIA_MAX = 0.02; // ±0.02% de tendencia máxima
        this.preciosBase = new Map(); // Almacena los precios base para cada símbolo
        this.historialService = new HistorialPreciosService();
    }

    async obtenerPrecioActual(simbolo, activoId) {
        if (!simbolo || !activoId) {
            console.error('Símbolo o ID de activo no proporcionado');
            return { precio: 0, variacion: 0 };
        }

        try {
            // Verificar caché
            const cachePrecio = this.cache.get(simbolo);
            if (cachePrecio && (Date.now() - cachePrecio.timestamp) < this.CACHE_DURATION) {
                return { precio: cachePrecio.precio };
            }

            // Siempre intentar obtener el último precio registrado primero
            const ultimoPrecio = await this.historialService.obtenerUltimoPrecio(activoId);
            let precioBase;
            
            if (ultimoPrecio) {
                precioBase = ultimoPrecio;
                console.log(`Usando último precio registrado para ${simbolo}: ${precioBase} USD`);
            } else {
                precioBase = this.generarPrecioBaseAleatorio();
                console.log(`Generando precio base aleatorio para ${simbolo}: ${precioBase} USD`);
                // Registrar el precio base inicial en el historial
                await this.historialService.registrarPrecio(activoId, precioBase);
            }
            
            // Actualizar el precio base en el mapa
            this.preciosBase.set(simbolo, precioBase);

            // Calcular variación aleatoria con distribución normal
            const variacionAleatoria = (Math.random() + Math.random() + Math.random() - 1.5) * (this.VOLATILIDAD / 1.5);
            const precio = precioBase * (1 + variacionAleatoria);
            const precioFinal = parseFloat(precio.toFixed(2));

            console.log(`Precio simulado de ${simbolo}: ${precioFinal} USD (variación: ${(variacionAleatoria * 100).toFixed(3)}%)`);

            // Actualizar caché
            this.cache.set(simbolo, {
                precio: precioFinal,
                timestamp: Date.now()
            });

            // Actualizar precio base con una tendencia más suave
            const tendencia = (Math.random() - 0.5) * this.TENDENCIA_MAX;
            this.preciosBase.set(simbolo, precioBase * (1 + tendencia));

            return { precio: precioFinal };
        } catch (error) {
            console.error('Error al generar precio simulado:', error);
            const cachePrecio = this.cache.get(simbolo);
            const precio = cachePrecio ? cachePrecio.precio : await this.historialService.obtenerUltimoPrecio(activoId) || 0;
            return { precio, variacion: 0 };
        }
    }

    generarPrecioBaseAleatorio() {
        // Genera un precio base aleatorio entre 10 y 1000
        return Math.random() * 990 + 10;
    }

    async actualizarPreciosActivos(activos) {
        const actualizaciones = [];
        
        for (const activo of activos) {
            try {
                const { precio } = await this.obtenerPrecioActual(activo.simbolo, activo.id);
                
                // Registrar precio en el historial
                await this.historialService.registrarPrecio(activo.id, precio);
                
                // Calcular variación después de registrar el precio
                const variacion = await this.historialService.calcularVariacionPorcentual(activo.id, precio);
                
                actualizaciones.push({
                    id: activo.id,
                    ultimo_precio: precio,
                    ultima_actualizacion: new Date(),
                    variacion: variacion
                });
            } catch (error) {
                console.error(`Error actualizando precio de ${activo.simbolo}:`, error);
            }
        }

        return actualizaciones;
    }
}

module.exports = PreciosService;