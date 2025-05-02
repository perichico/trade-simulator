const { sequelize, Usuario, Activo, Transaccion } = require("../models/index");

// Obtener todas las transacciones
exports.obtenerTransacciones = async (req, res) => {
  try {
    const transacciones = await Transaccion.findAll({
      include: [Usuario, Activo],
      order: [["fecha", "DESC"]]
    });

    // Transformar los datos para incluir el valorTotal
    const transaccionesConValor = transacciones.map(transaccion => ({
      ...transaccion.toJSON(),
      valorTotal: transaccion.precio * Math.abs(transaccion.cantidad)
    }));

    res.status(200).json(transaccionesConValor);
  } catch (error) {
    console.error('Error al obtener las transacciones:', error);
    res.status(500).json({ error: "Error al obtener las transacciones" });
  }
};

// Crear una nueva transacción (Compra/Venta)
exports.crearTransaccion = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      // Obtener los datos del formulario
      const { activoId, tipo, cantidad } = req.body;

      // Validaciones iniciales
      if (!activoId || !tipo || !cantidad) {
        return res.status(400).json({ error: 'Datos incompletos para la transacción' });
      }

      if (!['compra', 'venta'].includes(tipo.toLowerCase())) {
        return res.status(400).json({ error: 'Tipo de transacción inválido. Debe ser "compra" o "venta"' });
      }

      if (cantidad <= 0) {
        return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
      }

      // Obtener el usuarioId desde la sesión
      const usuarioId = req.session.usuario.id;
  
      // Verificar si el usuario está autenticado
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }
  
      // Verificar si el usuario y el activo existen
      let usuario, activo;
      try {
        [usuario, activo] = await Promise.all([
          Usuario.findByPk(usuarioId),
          Activo.findByPk(activoId, {
            attributes: ['id', 'nombre', 'simbolo']
          })
        ]);
      } catch (error) {
        console.error('Error al buscar usuario o activo:', error);
        await transaction.rollback();
        return res.status(500).json({ error: "Error al verificar usuario o activo" });
      }
      
      if (!usuario) {
        await transaction.rollback();
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      if (!activo) {
        await transaction.rollback();
        return res.status(404).json({ error: "Activo no encontrado" });
      }
      
      // Validar que el activo tenga un símbolo válido
      if (!activo.simbolo) {
        await transaction.rollback();
        return res.status(400).json({ error: "El activo no tiene un símbolo válido" });
      }
      
      // Importar el servicio de historial de precios
      const HistorialPreciosService = require('../services/historialPreciosService');
      const historialService = new HistorialPreciosService();
      
      // Obtener el precio del activo desde el historial de precios
      const precioEnTransaccion = await historialService.obtenerUltimoPrecio(activoId);
      
      if (!precioEnTransaccion) {
        await transaction.rollback();
        return res.status(400).json({ error: "El activo no tiene un precio válido para realizar la transacción" });
      }
      const costoTotal = precioEnTransaccion * cantidad;
  
      // Lógica de compra
      if (tipo === "compra") {
        if (usuario.balance < costoTotal) {
          await transaction.rollback();
          return res.status(400).json({ error: "Saldo insuficiente" });
        }
        await usuario.update({ balance: usuario.balance - costoTotal }, { transaction });
  
        // Registrar transacción de compra
        const transaccion = await Transaccion.create({
          usuario_id: usuarioId,
          activo_id: activoId,
          tipo,
          cantidad,
          precio: precioEnTransaccion,
          fecha: new Date()
        }, { transaction });

        await transaction.commit();
  
        return res.status(201).json({
          mensaje: "Transacción realizada con éxito",
          transaccion: {
            ...transaccion.toJSON(),
            valorTotal: costoTotal
          }
        });
      }
  
      // Lógica de venta
      if (tipo === "venta") {
        // Verificar cuántos activos tiene el usuario
        const cantidadActivosUsuario = await Transaccion.sum("cantidad", {
          where: {
            usuarioId,
            activoId,
          },
          transaction
        });
  
        // Si no tiene suficientes activos para vender
        if (cantidadActivosUsuario < cantidad) {
          await transaction.rollback();
          return res.status(400).json({ error: "No tienes suficientes activos para vender" });
        }
  
        // Actualizar el balance del usuario
        await usuario.update({ balance: usuario.balance + costoTotal }, { transaction });
  
        // Registrar transacción de venta
        const transaccion = await Transaccion.create({
          usuario_id: usuarioId,
          activo_id: activoId,
          tipo,
          cantidad: -cantidad,
          precio: precioEnTransaccion,
          fecha: new Date()
        }, { transaction });

        await transaction.commit();
  
        return res.status(201).json({
          mensaje: "Transacción realizada con éxito",
          transaccion: {
            ...transaccion.toJSON(),
            valorTotal: costoTotal
          }
        });
      }
  
      // Si el tipo no es válido
      await transaction.rollback();
      return res.status(400).json({ error: "Tipo de transacción inválido" });
    } catch (error) {
      await transaction.rollback();
      console.error('Error en la transacción:', error);
      let mensajeError = 'Error al registrar la transacción';
      
      if (error.name === 'SequelizeValidationError') {
        mensajeError = 'Error de validación en los datos de la transacción';
      } else if (error.name === 'SequelizeDatabaseError') {
        mensajeError = 'Error en la base de datos al procesar la transacción';
      } else if (error.name === 'SequelizeConnectionError') {
        mensajeError = 'Error de conexión con la base de datos';
      }
      
      return res.status(500).json({ error: mensajeError });
    }
  };
  

// Obtener transacciones de un usuario
exports.obtenerTransaccionesPorUsuario = async (req, res) => {
  try {
    // Verificar si el usuario está autenticado
    if (!req.session.usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const usuarioId = req.session.usuario.id;

    // Verificar si el usuario existe
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const transacciones = await Transaccion.findAll({
      where: { usuario_id: usuarioId },
      include: [{
        model: Activo,
        attributes: ['id', 'nombre', 'simbolo', 'ultimo_precio']
      }],
      order: [["fecha", "DESC"]]
    });

    // Importar el servicio de precios para obtener precios actualizados
    const PreciosService = require('../services/preciosService');
    const preciosService = new PreciosService();

    // Transformar los datos y calcular valores actualizados
    const transaccionesActualizadas = await Promise.all(transacciones.map(async (transaccion) => {
      const transaccionJSON = transaccion.toJSON();
      const valorTotal = transaccion.precio * Math.abs(transaccion.cantidad);

      try {
        // Obtener precio actual del activo
        const precioActual = await preciosService.obtenerPrecioActual(transaccion.activo.simbolo);
        const precioFinal = precioActual || transaccion.activo.ultimo_precio;

        // Calcular rendimiento
        const rendimiento = (precioFinal - transaccion.precio) * Math.abs(transaccion.cantidad);
        const rendimientoPorcentual = ((precioFinal - transaccion.precio) / transaccion.precio) * 100;

        return {
          ...transaccionJSON,
          valorTotal,
          precioActual: precioFinal,
          rendimiento,
          rendimientoPorcentual
        };
      } catch (error) {
        console.error(`Error al obtener precio actual para ${transaccion.activo.simbolo}:`, error);
        return {
          ...transaccionJSON,
          valorTotal,
          precioActual: transaccion.activo.ultimo_precio,
          rendimiento: 0,
          rendimientoPorcentual: 0
        };
      }
    }));

    res.status(200).json(transaccionesActualizadas);
  } catch (error) {
    console.error('Error al obtener las transacciones del usuario:', error);
    res.status(500).json({ 
      error: "Error al obtener las transacciones del usuario",
      detalles: error.message
    });
  }
};
