module.exports = {
    // Configuración del servicio de precios
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos en milisegundos
    
    // Configuración de reintentos para las solicitudes a Google Finance
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 segundo entre reintentos
    
    // Configuración de la actualización en lote
    BATCH_SIZE: 10, // Número máximo de activos a actualizar simultáneamente
    UPDATE_INTERVAL: 5 * 60 * 1000, // Intervalo de actualización automática (5 minutos)
    
    // Headers para las solicitudes HTTP
    REQUEST_HEADERS: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
};