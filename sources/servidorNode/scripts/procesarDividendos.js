/**
 * Script para procesar pagos de dividendos automáticamente
 * Este script puede ejecutarse manualmente o mediante una tarea programada externa
 * 
 * Ejemplo de uso con un cron de sistema:
 * 0 0 * * * /usr/bin/node /ruta/al/script/procesarDividendos.js >> /var/log/dividendos.log 2>&1
 */

const { sequelize } = require('../models/index');
const DividendoService = require('../services/dividendoService');

async function procesarDividendosProgramados() {
  const dividendoService = new DividendoService();
  
  try {
    console.log("Iniciando procesamiento de dividendos programados...");
    console.log("Fecha: " + new Date().toISOString());
    
    const dividendos = await dividendoService.procesarDividendosAutomaticos();
    
    console.log(`Procesamiento completado: ${dividendos.length} dividendos generados.`);
    
  } catch (error) {
    console.error("Error durante el procesamiento de dividendos:", error);
  } finally {
    // Cerrar la conexión a la base de datos
    await sequelize.close();
  }
}

// Ejecutar el procesamiento
procesarDividendosProgramados()
  .then(() => {
    console.log("Proceso finalizado");
    // Finalizar el proceso con código 0 (éxito)
    process.exit(0);
  })
  .catch(err => {
    console.error("Error en el proceso principal:", err);
    // Finalizar el proceso con código 1 (error)
    process.exit(1);
  });
