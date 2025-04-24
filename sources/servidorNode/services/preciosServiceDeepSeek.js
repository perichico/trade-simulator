const { OpenAI } = require('openai');

class PreciosService {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: "https://api.deepseek.com"
        });
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

            // Consultar precio a la API de DeepSeek
            const response = await this.client.chat.completions.create({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "Eres un experto en mercados financieros que proporciona precios actuales de activos"
                    },
                    {
                        role: "user",
                        content: `¿Cuál es el precio actual de ${simbolo}?`
                    }
                ],
                stream: false
            });

            const precioTexto = response.choices[0].message.content;
            const precioFinal = parseFloat(precioTexto.match(/\d+\.?\d*/)[0]);

            console.log(`Precio obtenido de DeepSeek para ${simbolo}: ${precioFinal} USD`);

            // Actualizar caché
            this.cache.set(simbolo, {
                precio: precioFinal,
                timestamp: Date.now()
            });

            return precioFinal;
        } catch (error) {
            console.error('Error al generar precio simulado:', error);
            const cachePrecio = this.cache.get(simbolo);
            return cachePrecio ? cachePrecio.precio : 0;
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