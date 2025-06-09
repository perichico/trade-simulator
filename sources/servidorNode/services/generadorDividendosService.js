const DividendoService = require('./dividendoService');

class GeneradorDividendosService {
  constructor() {
    this.dividendoService = new DividendoService();
    this.intervalo = null;
  }

  // Iniciar el servicio de generación automática de dividendos
  iniciarServicio() {
    console.log('🚀 Iniciando servicio de generación automática de dividendos...');
    
    // Ejecutar inmediatamente después de que la DB esté lista
    setTimeout(() => {
      this.ejecutarProcesamiento()
        .catch(err => console.error('Error en procesamiento inicial:', err));
      
      // Configurar intervalo para ejecutar cada 24 horas
      this.intervalo = setInterval(() => {
        this.ejecutarProcesamiento()
          .catch(err => console.error('Error en procesamiento programado:', err));
      }, 24 * 60 * 60 * 1000); // 24 horas
    }, 5000);
  }

  // Ejecutar el procesamiento de dividendos automáticos
  async ejecutarProcesamiento() {
    try {
      console.log('⏰ Ejecutando procesamiento automático de dividendos...');
      const dividendos = await this.dividendoService.procesarDividendosAutomaticos();
      console.log(`✅ Procesamiento completado: ${dividendos.length} dividendos generados`);
      return dividendos;
    } catch (error) {
      console.error('❌ Error en procesamiento automático:', error);
      throw error;
    }
  }

  // Detener el servicio
  detenerServicio() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
      console.log('🛑 Servicio de dividendos automáticos detenido');
    }
  }
}

module.exports = GeneradorDividendosService;