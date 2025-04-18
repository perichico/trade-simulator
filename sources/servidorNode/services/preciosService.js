const axios = require('axios');

class PreciosService {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos
        this.API_KEY = '9c0f61fb452f4ee2bf0c253292af6e5f';
        this.BASE_URL = 'https://api.twelvedata.com';
    }

    async obtenerPrecioActual(simbolo) {
        if (!simbolo) {
            console.error('Símbolo no proporcionado');
            return 0;
        }

        try {
            // Verificar caché
            const cachePrecio = this.cache.get(simbolo);
            if (cachePrecio && (Date.now() - cachePrecio.timestamp) < this.CACHE_DURATION) {
                return cachePrecio.precio;
            }

            const response = await axios.get(`${this.BASE_URL}/quote?symbol=${simbolo}&apikey=${this.API_KEY}`);
            const data = response.data;
            console.log(`El precio actual de ${simbolo} es: ${data.close} USD`);
            
            const precio = parseFloat(data.close);
            if (isNaN(precio) || precio <= 0) {
                throw new Error(`Precio no válido para ${simbolo}`);
            }

            // Actualizar caché
            this.cache.set(simbolo, {
                precio,
                timestamp: Date.now()
            });

            return precio;
        } catch (error) {
            console.error('Error al obtener los datos:', error);
            const cachePrecio = this.cache.get(simbolo);
            return cachePrecio ? cachePrecio.precio : 0;
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