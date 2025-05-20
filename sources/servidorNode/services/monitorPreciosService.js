const { Alerta } = require('../models/index');
const alertaController = require('../controllers/alertaController');
const HistorialPreciosService = require('./historialPreciosService');

class MonitorPreciosService {
    constructor() {
        this.historialService = new HistorialPreciosService();
        this.intervaloVerificacion = 5 * 60 * 1000; // 5 minutos en milisegundos
        this.monitoreoActivo = false;
    }

    iniciarMonitoreo() {
        if (this.monitoreoActivo) {
            console.log('El monitoreo de precios ya está activo');
            return;
        }

        this.monitoreoActivo = true;
        this.intervalId = setInterval(async () => {
            try {
                await alertaController.verificarAlertas();
            } catch (error) {
                console.error('Error en el monitoreo de precios:', error);
            }
        }, this.intervaloVerificacion);

        console.log('Monitoreo de precios iniciado');
    }

    detenerMonitoreo() {
        if (!this.monitoreoActivo) {
            console.log('El monitoreo de precios no está activo');
            return;
        }

        clearInterval(this.intervalId);
        this.monitoreoActivo = false;
        console.log('Monitoreo de precios detenido');
    }

    cambiarIntervalo(nuevoIntervaloMinutos) {
        if (nuevoIntervaloMinutos < 1) {
            throw new Error('El intervalo debe ser al menos 1 minuto');
        }

        this.intervaloVerificacion = nuevoIntervaloMinutos * 60 * 1000;
        
        if (this.monitoreoActivo) {
            this.detenerMonitoreo();
            this.iniciarMonitoreo();
        }

        console.log(`Intervalo de monitoreo actualizado a ${nuevoIntervaloMinutos} minutos`);
    }
}

module.exports = new MonitorPreciosService();