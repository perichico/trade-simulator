const { sequelize, Activo, Dividendo, PortafolioActivo, Portafolio, Op } = require('../models/index');

class DividendoService {
  // Método para inicializar el servicio con mejor manejo de errores
  async iniciarServicio() {
    console.log('Iniciando servicio de dividendos...');
    try {
      try {
        await this.verificarModelosDisponibles();
      } catch (error) {
        console.error('Error al verificar modelos en iniciarServicio:', error);
        return; // Salimos del método si no podemos verificar los modelos
      }
      
      console.log('Iniciando servicio de generación automática de dividendos...');
      
      // Verificar activos para dividendos de forma segura
      setTimeout(() => {
        this.verificarDividendosPendientes()
          .catch(err => console.error('Error al verificar dividendos pendientes:', err));
      }, 3000); // Retrasar para dar tiempo a que las tablas se inicialicen completamente
      
    } catch (error) {
      console.error('Error controlado al iniciar el servicio de dividendos:', error.message);
    }
  }

  async verificarModelosDisponibles() {
    // Verificar que podemos acceder a los modelos necesarios
    const { Activo, Dividendo } = require('../models/index');
    
    try {
      // Hacer una consulta simple para verificar disponibilidad
      await Activo.findOne({ limit: 1 });
      console.log('Modelo Activo disponible');
      return true;
    } catch (error) {
      console.error('El modelo Activo no está disponible:', error.message);
      throw new Error('Modelos no disponibles');
    }
  }
  
  // Verificar si una tabla existe en la base de datos
  async verificarTablaExiste(tableName) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = '${sequelize.config.database}' 
        AND table_name = '${tableName}'
      `;
      
      const [results] = await sequelize.query(query);
      return results[0]?.count > 0;
    } catch (error) {
      console.error(`Error al verificar si existe la tabla ${tableName}:`, error);
      return false;
    }
  }
  
  // Verificar dividendos pendientes de manera segura
  async verificarDividendosPendientes() {
    try {
      console.log('Verificando activos para generar dividendos...');
      
      // Obtener activos que pagan dividendos
      const activos = await Activo.findAll({
        where: {
          porcentaje_dividendo: {
            [Op.gt]: 0 // Porcentaje mayor que 0
          }
        }
      }).catch(err => {
        console.error('Error al buscar activos con dividendos:', err);
        return [];
      });
      
      console.log(`Se encontraron ${activos.length} activos con configuración de dividendos`);
      
      // Solo registrar activos con dividendos pendientes
      const hoy = new Date();
      for (const activo of activos) {
        try {
          if (this.debeGenerarDividendo(activo, hoy)) {
            console.log(`Activo ${activo.simbolo} (${activo.id}) elegible para generar dividendo`);
          }
        } catch (err) {
          console.error(`Error al verificar dividendos para activo ${activo.id}:`, err);
        }
      }
    } catch (error) {
      console.error('Error al verificar dividendos pendientes:', error);
    }
  }

  // Método para procesar dividendos pendientes
  async procesarDividendosPendientes() {
    const transaction = await sequelize.transaction();
    try {
      // Obtener dividendos en estado pendiente
      const dividendosPendientes = await Dividendo.findAll({
        where: { estado: 'pendiente' },
        include: [{ model: Activo }],
        transaction
      });
      
      for (const dividendo of dividendosPendientes) {
        await this.procesarPagoDividendos(
          dividendo.activo_id, 
          dividendo.monto_por_accion, 
          transaction
        );
        
        // Actualizar estado a 'pagado'
        await dividendo.update({ estado: 'pagado' }, { transaction });
      }
      
      await transaction.commit();
      return dividendosPendientes;
    } catch (error) {
      await transaction.rollback();
      console.error('Error al procesar dividendos pendientes:', error);
      throw error;
    }
  }

  async procesarDividendosAutomaticos() {
    const transaction = await sequelize.transaction();
    try {
      console.log('Iniciando procesamiento de dividendos automáticos...');
      
      // Obtener activos que pagan dividendos
      const activos = await Activo.findAll({
        where: {
          porcentaje_dividendo: {
            [Op.gt]: 0 // Porcentaje mayor que 0
          }
        }
      });
      
      console.log(`Se encontraron ${activos.length} activos con dividendos configurados`);
      
      const hoy = new Date();
      const dividendosCreados = [];
      
      // Procesar cada activo
      for (const activo of activos) {
        try {
          // Verificar si corresponde pagar dividendo
          if (this.debeGenerarDividendo(activo, hoy)) {
            console.log(`Generando dividendo para activo: ${activo.nombre} (${activo.simbolo})`);
            
            // Calcular monto por acción basado en el porcentaje anual y la frecuencia
            const montoPorAccion = this.calcularMontoPorAccion(activo);
            
            // Crear registro de dividendo
            const dividendo = await Dividendo.create({
              activo_id: activo.id,
              fecha: hoy,
              monto_por_accion: montoPorAccion,
              estado: 'pagado'  // Lo marcamos como pagado directamente
            }, { transaction });
            
            // Actualizar fecha de último dividendo en el activo
            await activo.update({
              ultima_fecha_dividendo: hoy
            }, { transaction });
            
            dividendosCreados.push(dividendo);
            
            // Procesar pagos a los portafolios que tienen este activo
            await this.procesarPagoDividendos(activo.id, montoPorAccion, transaction);
          }
        } catch (error) {
          console.error(`Error procesando dividendo para activo ${activo.id}:`, error);
          // Continuamos con el próximo activo
        }
      }
      
      await transaction.commit();
      console.log(`Procesamiento de dividendos completado. Se generaron ${dividendosCreados.length} dividendos.`);
      return dividendosCreados;
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error en procesarDividendosAutomaticos:', error);
      throw error;
    }
  }
  
  debeGenerarDividendo(activo, fechaActual) {
    // Si no hay fecha de último dividendo, siempre generar
    if (!activo.ultima_fecha_dividendo) {
      return true;
    }
    
    const ultimaFecha = new Date(activo.ultima_fecha_dividendo);
    const diasTranscurridos = this.calcularDiasEntreFechas(ultimaFecha, fechaActual);
    
    // Determinar el periodo en días según la frecuencia
    let periodoEnDias;
    switch (activo.frecuencia_dividendo) {
      case 'trimestral':
        periodoEnDias = 90; // Aproximadamente 3 meses
        break;
      case 'semestral':
        periodoEnDias = 180; // Aproximadamente 6 meses
        break;
      case 'anual':
      default:
        periodoEnDias = 365; // Aproximadamente 1 año
        break;
    }
    
    return diasTranscurridos >= periodoEnDias;
  }
  
  calcularDiasEntreFechas(fecha1, fecha2) {
    const diferenciaMs = fecha2.getTime() - fecha1.getTime();
    return Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
  }
  
  calcularMontoPorAccion(activo) {
    // Dividendo anual dividido por la frecuencia
    let divisor;
    switch (activo.frecuencia_dividendo) {
      case 'trimestral':
        divisor = 4;
        break;
      case 'semestral':
        divisor = 2;
        break;
      case 'anual':
      default:
        divisor = 1;
        break;
    }
    
    // Calcular monto por acción basado en el precio actual y el porcentaje anual
    const precioActual = activo.ultimo_precio || 0;
    const porcentajeAjustado = (activo.porcentaje_dividendo / 100) / divisor;
    
    return precioActual * porcentajeAjustado;
  }
  
  async procesarPagoDividendos(activoId, montoPorAccion, transaction) {
    try {
      // Encontrar todos los portafolios que contienen este activo
      const posiciones = await PortafolioActivo.findAll({
        where: { activo_id: activoId },
        transaction
      });
      
      console.log(`Procesando pago de dividendos para ${posiciones.length} posiciones del activo ${activoId}`);
      
      for (const posicion of posiciones) {
        // Calcular monto total para esta posición
        const montoTotal = montoPorAccion * posicion.cantidad;
        
        if (montoTotal <= 0) continue;
        
        // Actualizar el saldo del portafolio
        const portafolio = await Portafolio.findByPk(posicion.portafolio_id, { transaction });
        if (portafolio) {
          // Sumar el dividendo al saldo del portafolio
          const nuevoSaldo = parseFloat(portafolio.saldo || 0) + parseFloat(montoTotal);
          await portafolio.update({ saldo: nuevoSaldo }, { transaction });
        }
      }
    } catch (error) {
      console.error('Error en procesarPagoDividendos:', error);
      throw error;
    }
  }

  // Obtener dividendos por usuario 
  async obtenerDividendosPorUsuario(usuarioId) {
    try {
      // Obtener los portafolios del usuario
      const portafolios = await Portafolio.findAll({
        where: { usuario_id: usuarioId }
      });
      
      if (!portafolios.length) {
        return [];
      }
      
      const portafolioIds = portafolios.map(p => p.id);
      
      // Obtener los activos que tiene el usuario en sus portafolios
      const activosEnPortafolio = await PortafolioActivo.findAll({
        where: { portafolio_id: portafolioIds },
        attributes: ['activo_id', 'cantidad']
      });
      
      if (!activosEnPortafolio.length) {
        return [];
      }
      
      const activosPorId = {};
      activosEnPortafolio.forEach(item => {
        if (!activosPorId[item.activo_id]) {
          activosPorId[item.activo_id] = 0;
        }
        activosPorId[item.activo_id] += item.cantidad;
      });
      
      const activosIds = Object.keys(activosPorId).map(id => parseInt(id));
      
      // Obtener los dividendos de los activos que tiene el usuario
      const dividendos = await Dividendo.findAll({
        where: { activo_id: activosIds },
        include: [{ model: Activo }],
        order: [["fecha", "DESC"]]
      });
      
      // Calcular el monto recibido en base a la cantidad de acciones
      return dividendos.map(div => {
        const cantidadAcciones = activosPorId[div.activo_id] || 0;
        const montoTotal = div.monto_por_accion * cantidadAcciones;
        
        return {
          ...div.toJSON(),
          cantidadAcciones,
          montoTotal
        };
      });
    } catch (error) {
      console.error('Error al obtener dividendos del usuario:', error);
      throw error;
    }
  }
}

module.exports = DividendoService;