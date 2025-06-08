const { sequelize, Activo, Dividendo, PortafolioActivo, Portafolio, Usuario, Op } = require('../models/index');

class DividendoService {
  // Método para inicializar el servicio con mejor manejo de errores
  async iniciarServicio() {
    console.log('Iniciando servicio de dividendos...');
    try {
      await this.verificarModelosDisponibles();
      console.log('Iniciando servicio de generación automática de dividendos...');
      
      // Verificar activos para dividendos de forma segura
      setTimeout(() => {
        this.verificarDividendosPendientes()
          .catch(err => console.error('Error al verificar dividendos pendientes:', err));
      }, 3000);
      
    } catch (error) {
      console.error('Error controlado al iniciar el servicio de dividendos:', error.message);
    }
  }

  async verificarModelosDisponibles() {
    try {
      await Activo.findOne({ limit: 1 });
      console.log('Modelo Activo disponible');
      return true;
    } catch (error) {
      console.error('El modelo Activo no está disponible:', error.message);
      throw new Error('Modelos no disponibles');
    }
  }
  
  // Verificar dividendos pendientes de manera segura
  async verificarDividendosPendientes() {
    try {
      console.log('Verificando activos para generar dividendos...');
      
      const activos = await Activo.findAll({
        where: {
          porcentaje_dividendo: {
            [Op.gt]: 0
          }
        }
      }).catch(err => {
        console.error('Error al buscar activos con dividendos:', err);
        return [];
      });
      
      console.log(`Se encontraron ${activos.length} activos con configuración de dividendos`);
      
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
      
      const activos = await Activo.findAll({
        where: {
          porcentaje_dividendo: {
            [Op.gt]: 0
          }
        }
      });
      
      console.log(`Se encontraron ${activos.length} activos con dividendos configurados`);
      
      const hoy = new Date();
      const dividendosCreados = [];
      
      for (const activo of activos) {
        try {
          if (this.debeGenerarDividendo(activo, hoy)) {
            console.log(`Generando dividendo para activo: ${activo.nombre} (${activo.simbolo})`);
            
            const montoPorAccion = this.calcularMontoPorAccion(activo);
            
            const dividendo = await Dividendo.create({
              activo_id: activo.id,
              fecha: hoy,
              monto_por_accion: montoPorAccion,
              estado: 'pagado'
            }, { transaction });
            
            await activo.update({
              ultima_fecha_dividendo: hoy
            }, { transaction });
            
            dividendosCreados.push(dividendo);
            
            await this.procesarPagoDividendos(activo.id, montoPorAccion, transaction);
          }
        } catch (error) {
          console.error(`Error procesando dividendo para activo ${activo.id}:`, error);
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
    if (!activo.ultima_fecha_dividendo) {
      return true;
    }
    
    const ultimaFecha = new Date(activo.ultima_fecha_dividendo);
    const diasTranscurridos = this.calcularDiasEntreFechas(ultimaFecha, fechaActual);
    
    let periodoEnDias;
    switch (activo.frecuencia_dividendo) {
      case 'trimestral':
        periodoEnDias = 90;
        break;
      case 'semestral':
        periodoEnDias = 180;
        break;
      case 'anual':
      default:
        periodoEnDias = 365;
        break;
    }
    
    return diasTranscurridos >= periodoEnDias;
  }
  
  calcularDiasEntreFechas(fecha1, fecha2) {
    const diferenciaMs = fecha2.getTime() - fecha1.getTime();
    return Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
  }
  
  calcularMontoPorAccion(activo) {
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
    
    const precioActual = activo.ultimo_precio || 0;
    const porcentajeAjustado = (activo.porcentaje_dividendo / 100) / divisor;
    
    return precioActual * porcentajeAjustado;
  }
  
  async procesarPagoDividendos(activoId, montoPorAccion, transaction) {
    try {
      const posiciones = await PortafolioActivo.findAll({
        where: { activo_id: activoId },
        transaction
      });
      
      console.log(`Procesando pago de dividendos para ${posiciones.length} posiciones del activo ${activoId}`);
      
      for (const posicion of posiciones) {
        const montoTotal = montoPorAccion * posicion.cantidad;
        
        if (montoTotal <= 0) continue;
        
        const portafolio = await Portafolio.findByPk(posicion.portafolio_id, { transaction });
        if (portafolio) {
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
      console.log(`Obteniendo dividendos para usuario ID: ${usuarioId}`);
      
      // Primero obtener los portafolios del usuario
      const portafolios = await Portafolio.findAll({
        where: { usuario_id: usuarioId },
        attributes: ['id']
      }).catch(dbError => {
        console.error('Error al obtener portafolios:', dbError);
        throw new Error(`Error de base de datos al obtener portafolios: ${dbError.message}`);
      });
      
      if (!portafolios.length) {
        console.log(`Usuario ${usuarioId} no tiene portafolios`);
        return [];
      }
      
      const portafolioIds = portafolios.map(p => p.id);
      console.log(`Portafolios encontrados: ${portafolioIds.join(', ')}`);
      
      // Obtener las posiciones en activos de estos portafolios
      const activosEnPortafolio = await PortafolioActivo.findAll({
        where: { 
          portafolio_id: { [Op.in]: portafolioIds },
          cantidad: { [Op.gt]: 0 }
        },
        attributes: [
          'activo_id',
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_cantidad']
        ],
        group: ['activo_id']
      }).catch(dbError => {
        console.error('Error al obtener activos en portafolio:', dbError);
        throw new Error(`Error de base de datos al obtener activos: ${dbError.message}`);
      });
      
      if (!activosEnPortafolio.length) {
        console.log(`Usuario ${usuarioId} no tiene activos en portafolio`);
        return [];
      }
      
      // Crear mapa de activos con cantidades totales
      const activosPorId = {};
      activosEnPortafolio.forEach(item => {
        const activoId = item.activo_id || item.get('activo_id');
        const totalCantidad = item.get('total_cantidad') || item.total_cantidad || 0;
        activosPorId[activoId] = parseFloat(totalCantidad);
      });
      
      const activosIds = Object.keys(activosPorId).map(id => parseInt(id));
      console.log(`Activos con posiciones: ${activosIds.join(', ')}`);
      
      // Obtener todos los dividendos de estos activos con manejo de errores específico
      const dividendos = await Dividendo.findAll({
        where: { 
          activo_id: { [Op.in]: activosIds },
          estado: 'pagado' // Solo dividendos ya pagados
        },
        attributes: ['id', 'activo_id', 'fecha', 'monto_por_accion', 'estado'], // Solo campos que existen
        include: [{
          model: Activo,
          attributes: ['id', 'simbolo', 'nombre']
        }],
        order: [["fecha", "DESC"]],
        limit: 100 // Limitar resultados para evitar sobrecarga
      }).catch(dbError => {
        console.error('Error al obtener dividendos:', dbError);
        // Verificar si es error de columna inexistente
        if (dbError.message.includes('Unknown column') || dbError.message.includes('column')) {
          throw new Error(`Error: La base de datos no tiene la estructura esperada. ${dbError.message}`);
        }
        throw new Error(`Error de base de datos al obtener dividendos: ${dbError.message}`);
      });
      
      console.log(`Dividendos encontrados: ${dividendos.length}`);
      
      // Mapear los dividendos con información del usuario
      const dividendosConInfo = dividendos.map(div => {
        const activoId = div.activo_id;
        const cantidadAcciones = activosPorId[activoId] || 0;
        const montoTotal = parseFloat(div.monto_por_accion) * cantidadAcciones;
        
        return {
          id: div.id,
          activo_id: div.activo_id,
          fecha: div.fecha,
          monto_por_accion: parseFloat(div.monto_por_accion),
          estado: div.estado,
          activo: div.Activo ? {
            id: div.Activo.id,
            simbolo: div.Activo.simbolo,
            nombre: div.Activo.nombre
          } : null,
          cantidadAcciones: cantidadAcciones,
          montoTotal: montoTotal
        };
      });
      
      return dividendosConInfo;
      
    } catch (error) {
      console.error('Error detallado al obtener dividendos del usuario:', {
        error: error.message,
        stack: error.stack,
        usuarioId
      });
      throw new Error(`Error al obtener dividendos del usuario: ${error.message}`);
    }
  }

  // Obtener dividendos históricos incluyendo todos los estados
  async obtenerDividendosHistoricos(usuarioId) {
    try {
      console.log(`Obteniendo dividendos históricos para usuario ID: ${usuarioId}`);
      
      const portafolios = await Portafolio.findAll({
        where: { usuario_id: usuarioId },
        attributes: ['id']
      });
      
      if (!portafolios.length) {
        return [];
      }
      
      const portafolioIds = portafolios.map(p => p.id);
      
      // Obtener TODAS las posiciones (incluso las vendidas)
      const todasLasPosiciones = await PortafolioActivo.findAll({
        where: { 
          portafolio_id: { [Op.in]: portafolioIds }
        },
        attributes: ['activo_id'],
        group: ['activo_id']
      });
      
      if (!todasLasPosiciones.length) {
        return [];
      }
      
      const activosIds = todasLasPosiciones.map(p => p.activo_id);
      
      // Obtener TODOS los dividendos de estos activos
      const dividendos = await Dividendo.findAll({
        where: { 
          activo_id: { [Op.in]: activosIds }
        },
        include: [{
          model: Activo,
          attributes: ['id', 'simbolo', 'nombre']
        }],
        order: [["fecha", "DESC"]],
        limit: 200
      });
      
      return dividendos.map(div => ({
        id: div.id,
        activo_id: div.activo_id,
        fecha: div.fecha,
        monto_por_accion: parseFloat(div.monto_por_accion),
        estado: div.estado,
        activo: div.Activo ? {
          id: div.Activo.id,
          simbolo: div.Activo.simbolo,
          nombre: div.Activo.nombre
        } : null
      }));
      
    } catch (error) {
      console.error('Error al obtener dividendos históricos:', error);
      throw error;
    }
  }

  // Procesar el pago de un dividendo específico
  async procesarPagoDividendo(dividendo) {
    const transaction = await sequelize.transaction();
    
    try {
      console.log(`Procesando pago de dividendo ID: ${dividendo.id} para activo ${dividendo.activo_id}`);
      
      const portafoliosConActivo = await PortafolioActivo.findAll({
        where: { activo_id: dividendo.activo_id, cantidad: { [Op.gt]: 0 } },
        include: [{ model: Portafolio }],
        transaction
      });

      console.log(`Encontrados ${portafoliosConActivo.length} portafolios con el activo ${dividendo.activo_id}`);

      let totalPagado = 0;
      let usuariosAfectados = 0;

      for (const posicion of portafoliosConActivo) {
        const cantidadAcciones = parseFloat(posicion.cantidad);
        const montoDividendo = cantidadAcciones * parseFloat(dividendo.monto_por_accion);
        
        const nuevoSaldo = parseFloat(posicion.Portafolio.saldo) + montoDividendo;
        
        await posicion.Portafolio.update({
          saldo: nuevoSaldo
        }, { transaction });

        totalPagado += montoDividendo;
        usuariosAfectados++;

        console.log(`Portafolio ID ${posicion.portafolio_id}: ${cantidadAcciones} acciones x ${dividendo.monto_por_accion}€ = ${montoDividendo}€. Nuevo saldo: ${nuevoSaldo}€`);
      }

      await transaction.commit();
      
      console.log(`Dividendo procesado: ${totalPagado}€ pagados a ${usuariosAfectados} portafolios`);
      
      return {
        totalPagado,
        usuariosAfectados,
        portafoliosAfectados: portafoliosConActivo.length
      };
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error al procesar pago de dividendo:', error);
      throw error;
    }
  }

  // Obtener estadísticas de un dividendo específico
  async obtenerEstadisticasDividendo(dividendoId) {
    try {
      const dividendo = await Dividendo.findByPk(dividendoId, {
        include: [{ model: Activo }]
      });

      if (!dividendo) {
        throw new Error('Dividendo no encontrado');
      }

      const portafoliosConActivo = await PortafolioActivo.findAll({
        where: { 
          activo_id: dividendo.activo_id,
          cantidad: { [Op.gt]: 0 }
        },
        include: [{ model: Portafolio, include: [{ model: Usuario }] }]
      });

      const totalAcciones = portafoliosConActivo.reduce((total, posicion) => {
        return total + parseFloat(posicion.cantidad);
      }, 0);

      const montoTotalDividendo = totalAcciones * parseFloat(dividendo.monto_por_accion);

      return {
        activo: {
          simbolo: dividendo.Activo.simbolo,
          nombre: dividendo.Activo.nombre,
          tipoActivo: dividendo.Activo.TipoActivo?.nombre || 'Sin tipo'
        },
        usuariosAfectados: portafoliosConActivo.length,
        totalAcciones: totalAcciones,
        montoPorAccion: parseFloat(dividendo.monto_por_accion),
        montoTotalDividendo: montoTotalDividendo
      };
    } catch (error) {
      console.error('Error al obtener estadísticas del dividendo:', error);
      throw error;
    }
  }
}

module.exports = DividendoService;