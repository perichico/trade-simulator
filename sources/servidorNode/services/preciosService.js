const yahooFinance = require('yahoo-finance2');

class PreciosService {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos
    }

    async obtenerPrecioActual(simbolo) {
        try {
            // Verificar si hay un precio en caché y si aún es válido
            const cachePrecio = this.cache.get(simbolo);
            if (cachePrecio && (Date.now() - cachePrecio.timestamp) < this.CACHE_DURATION) {
                return cachePrecio.precio;
            }

            // Si no hay caché válido, consultar a Yahoo Finance
            const quote = await yahooFinance.quote(simbolo);
            if (!quote || !quote.regularMarketPrice) {
                throw new Error(`No se pudo obtener el precio para ${simbolo}`);
            }

            const precio = quote.regularMarketPrice;

            // Guardar en caché
            this.cache.set(simbolo, {
                precio,
                timestamp: Date.now()
            });

            return precio;
        } catch (error) {
            console.error(`Error al obtener precio para ${simbolo}:`, error);
            throw error;
        }
    }

    async actualizarPreciosActivos(activos) {
        const actualizaciones = [];
        
        for (const activo of activos) {
            try {
                const precio = await this.obtenerPrecioActual(activo.simbolo);
                actualizaciones.push({
                    id: activo.id,
                    ultimo_precio: precio,
                    ultima_actualizacion: new Date()
                });
            } catch (error) {
                console.error(`Error actualizando precio de ${activo.simbolo}:`, error);
            }
        }

        return actualizaciones;
    }
}

module.exports = PreciosService;