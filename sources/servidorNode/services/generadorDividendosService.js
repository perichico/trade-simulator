const DividendoService = require('./dividendoService');

class GeneradorDividendosService {
  constructor() {
    this.dividendoService = new DividendoService();
    this.intervalo = null;
  }

  // Iniciar el servicio de generación automática de dividendos
  iniciarServicio() {
    console.log('Iniciando servicio de generación automática de dividendos...');
    
    // Ejecutar inmediatamente
    setTimeout(() => {
      this.ejecutarProcesamiento().catch(err => {
        console.error('Error en el procesamiento inicial de dividendos:', err);
      });
    }, 5000); // Esperar 5 segundos para que la DB esté lista

    // Configurar ejecución periódica (cada 24 horas)
    this.intervalo = setInterval(() => {
      this.ejecutarProcesamiento().catch(err => {
        console.error('Error en el procesamiento periódico de dividendos:', err);
      });
    }, 24 * 60 * 60 * 1000); // 24 horas

    console.log('Servicio de generación automática de dividendos configurado');
  }

  // Ejecutar el procesamiento de dividendos automáticos
  async ejecutarProcesamiento() {
    try {
      console.log('Ejecutando procesamiento automático de dividendos...');
      const dividendos = await this.dividendoService.procesarDividendosAutomaticos();
      console.log(`Procesamiento completado. ${dividendos.length} dividendos generados.`);
      return dividendos;
    } catch (error) {
      console.error('Error en el procesamiento automático de dividendos:', error);
      throw error;
    }
  }

  // Detener el servicio
  detenerServicio() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
      console.log('Servicio de generación automática de dividendos detenido');
    }
  }
}

module.exports = GeneradorDividendosService;