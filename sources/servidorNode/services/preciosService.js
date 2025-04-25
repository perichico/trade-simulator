const HistorialPreciosService = require('./historialPreciosService');

class PreciosService {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos
        this.VOLATILIDAD = 0.02; // 2% de volatilidad máxima
        this.preciosBase = new Map(); // Almacena los precios base para cada símbolo
        this.historialService = new HistorialPreciosService();
    }

    async obtenerPrecioActual(simbolo, activoId) {
        if (!simbolo) {
            console.error('Símbolo no proporcionado');
            return { precio: 0, variacion: 0 };
        }

        try {
            // Verificar caché
            const cachePrecio = this.cache.get(simbolo);
            if (cachePrecio && (Date.now() - cachePrecio.timestamp) < this.CACHE_DURATION) {
                // No calculamos la variación aquí, se calculará después de registrar el precio
                return { precio: cachePrecio.precio };
            }

            // Generar precio aleatorio
            let precioBase = this.preciosBase.get(simbolo);
            if (!precioBase) {
                // Si no existe un precio base, generamos uno inicial
                precioBase = this.generarPrecioBaseAleatorio();
                this.preciosBase.set(simbolo, precioBase);
            }

            // Calcular variación aleatoria
            const variacionAleatoria = (Math.random() * 2 - 1) * this.VOLATILIDAD;
            const precio = precioBase * (1 + variacionAleatoria);
            const precioFinal = parseFloat(precio.toFixed(2));

            console.log(`Precio simulado de ${simbolo}: ${precioFinal} USD`);

            // Actualizar caché
            this.cache.set(simbolo, {
                precio: precioFinal,
                timestamp: Date.now()
            });

            // Actualizar precio base con una pequeña tendencia
            const tendencia = (Math.random() - 0.5) * 0.001; // ±0.1% de tendencia
            this.preciosBase.set(simbolo, precioBase * (1 + tendencia));

            // No calculamos la variación aquí, se calculará después de registrar el precio
            return { precio: precioFinal };
        } catch (error) {
            console.error('Error al generar precio simulado:', error);
            const cachePrecio = this.cache.get(simbolo);
            return { 
                precio: cachePrecio ? cachePrecio.precio : 0
            };
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