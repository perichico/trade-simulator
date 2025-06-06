const { sequelize, Usuario, Activo, Transaccion, Portafolio, PortafolioActivo } = require("../models/index");
const portafolioController = require('./portafolioController');

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
      // Verificar si el usuario está autenticado
      if (!req.session || !req.session.usuario) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      // Verificar si el usuario está suspendido
      if (req.session.usuario.estado === 'suspendido') {
        return res.status(403).json({ 
          error: "Usuario suspendido",
          tipo: "USUARIO_SUSPENDIDO",
          mensaje: "Tu cuenta ha sido suspendida. Contacta al administrador para más información."
        });
      }

      // Obtener los datos del formulario
      const { activoId, tipo, cantidad, portafolioSeleccionado } = req.body;

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

      // Obtener el portafolio del usuario
      let portafolio;
      
      if (portafolioSeleccionado) {
        portafolio = await Portafolio.findOne({
          where: { 
            id: portafolioSeleccionado,
            usuario_id: usuarioId 
          }
        });
      } else {
        // Si no hay portafolio seleccionado, usar el portafolio principal
        portafolio = await Portafolio.findOne({
          where: { usuario_id: usuarioId },
          order: [['id', 'ASC']]
        });
      }
      
      if (!portafolio) {
        await transaction.rollback();
        return res.status(404).json({ error: "Portafolio no encontrado" });
      }

      const portafolioId = portafolio.id;
  
      // Lógica de compra
      if (tipo === "compra") {
        // Verificar que el usuario tenga suficiente saldo
        if (portafolio.saldo < costoTotal) {
          await transaction.rollback();
          return res.status(400).json({ error: "Saldo insuficiente" });
        }

        // Actualizar el saldo del portafolio
        await portafolio.update({ saldo: portafolio.saldo - costoTotal }, { transaction });

        // Verificar si el usuario ya tiene este activo en el portafolio
        let portafolioActivo = await PortafolioActivo.findOne({
          where: { 
            portafolio_id: portafolioId, 
            activo_id: activoId 
          },
          transaction
        });

        if (portafolioActivo) {
          // Si ya tiene el activo, actualizar cantidad y precio promedio
          const cantidadAnterior = parseFloat(portafolioActivo.cantidad) || 0;
          const precioAnterior = parseFloat(portafolioActivo.precio_compra) || 0;
          const nuevaCantidad = cantidadAnterior + parseInt(cantidad);
          
          // Calcular precio promedio ponderado
          const valorAnterior = cantidadAnterior * precioAnterior;
          const valorNuevo = cantidad * precioEnTransaccion;
          const precioPromedio = (valorAnterior + valorNuevo) / nuevaCantidad;

          console.log('=== CALCULANDO PRECIO PROMEDIO ===');
          console.log('Cantidad anterior:', cantidadAnterior);
          console.log('Precio anterior:', precioAnterior);
          console.log('Nueva cantidad a comprar:', cantidad);
          console.log('Precio actual transacción:', precioEnTransaccion);
          console.log('Valor anterior:', valorAnterior);
          console.log('Valor nuevo:', valorNuevo);
          console.log('Precio promedio calculado:', precioPromedio);
          console.log('Cantidad total final:', nuevaCantidad);
          console.log('================================');

          await portafolioActivo.update({ 
            cantidad: nuevaCantidad,
            precio_compra: precioPromedio,
            fecha_compra: new Date()
          }, { transaction });
        } else {
          // Si no tiene el activo, crear nueva entrada
          console.log('=== CREANDO NUEVA POSICIÓN ===');
          console.log('Activo ID:', activoId);
          console.log('Cantidad:', cantidad);
          console.log('Precio de compra:', precioEnTransaccion);
          console.log('==============================');

          await PortafolioActivo.create({
            portafolio_id: portafolioId,
            activo_id: activoId,
            cantidad: cantidad,
            precio_compra: precioEnTransaccion,
            fecha_compra: new Date()
          }, { transaction });
        }

      } else if (tipo === "venta") {
        // Lógica para venta - verificar que tenga suficientes activos
        const portafolioActivo = await PortafolioActivo.findOne({
          where: { 
            portafolio_id: portafolioId, 
            activo_id: activoId 
          },
          transaction
        });

        if (!portafolioActivo || portafolioActivo.cantidad < cantidad) {
          await transaction.rollback();
          return res.status(400).json({ error: "No tienes suficientes activos para vender" });
        }

        // Actualizar el saldo del portafolio (agregar dinero por la venta)
        const saldoActual = parseFloat(portafolio.saldo) || 0;
        const costoTotalNumerico = parseFloat(costoTotal) || 0;
        const nuevoSaldo = parseFloat((saldoActual + costoTotalNumerico).toFixed(2));
        await portafolio.update({ saldo: nuevoSaldo }, { transaction });

        // Actualizar o eliminar el activo del portafolio
        if (portafolioActivo.cantidad === cantidad) {
          // Si vende todos los activos, eliminar la entrada
          await portafolioActivo.destroy({ transaction });
        } else {
          // Si vende parcialmente, actualizar la cantidad
          await portafolioActivo.update({ 
            cantidad: portafolioActivo.cantidad - cantidad 
          }, { transaction });
        }
      }
  
      // Registrar transacción
      const transaccion = await Transaccion.create({
        usuario_id: usuarioId,
        activo_id: activoId,
        tipo,
        cantidad: tipo === "venta" ? -cantidad : cantidad,
        precio: precioEnTransaccion,
        fecha: new Date()
      }, { transaction });
      
      // NO llamar a actualizarPortafolio ya que ya manejamos PortafolioActivo arriba
      // await portafolioController.actualizarPortafolio(usuarioId, activoId, cantidadParaPortafolio, transaction, portafolioSeleccionado);

      await transaction.commit();
  
      return res.status(201).json({
        mensaje: "Transacción realizada con éxito",
        transaccion: {
          ...transaccion.toJSON(),
          valorTotal: costoTotal
        }
      });

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
      
      return {
        ...transaccionJSON,
        valorTotal: valorTotal
      };
    }));

    res.status(200).json(transaccionesActualizadas);
  } catch (error) {
    console.error('Error al obtener transacciones del usuario:', error);
    res.status(500).json({ error: "Error al obtener las transacciones del usuario" });
  }
};

// Obtener transacciones de un activo específico para el usuario actual
exports.obtenerTransaccionesPorActivo = async (req, res) => {
  try {
    // Verificar si el usuario está autenticado
    if (!req.session.usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const usuarioId = req.session.usuario.id;
    const { activoId } = req.params;

    // Validar que activoId sea un número válido
    if (!activoId || isNaN(parseInt(activoId))) {
      return res.status(400).json({ error: "ID de activo inválido" });
    }

    // Verificar si el usuario existe
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar si el activo existe
    const activo = await Activo.findByPk(activoId);
    if (!activo) {
      return res.status(404).json({ error: "Activo no encontrado" });
    }

    const transacciones = await Transaccion.findAll({
      where: { 
        usuario_id: usuarioId,
        activo_id: activoId 
      },
      include: [{
        model: Activo,
        attributes: ['id', 'nombre', 'simbolo', 'ultimo_precio']
      }],
      order: [["fecha", "DESC"]]
    });

    // Transformar los datos para incluir el valorTotal
    const transaccionesFormateadas = transacciones.map(transaccion => ({
      ...transaccion.toJSON(),
      valorTotal: transaccion.precio * Math.abs(transaccion.cantidad)
    }));

    res.status(200).json(transaccionesFormateadas);
  } catch (error) {
    console.error('Error al obtener transacciones por activo:', error);
    res.status(500).json({ error: "Error al obtener las transacciones del activo" });
  }
};

// Obtener una transacción específica por ID
exports.obtenerTransaccionPorId = async (req, res) => {
    try {
        console.log('=== INICIANDO OBTENER TRANSACCIÓN POR ID ===');
        const { id } = req.params;
        const usuarioId = req.session.usuario.id;
        
        console.log('ID de transacción solicitada:', id);
        console.log('Usuario solicitante:', req.session.usuario.nombre);
        
        // Validar que el ID sea un número válido
        if (!id || isNaN(id)) {
            console.log('❌ ID de transacción inválido:', id);
            return res.status(400).json({ error: 'ID de transacción inválido' });
        }
        
        // Buscar la transacción
        const transaccion = await Transaccion.findOne({
            where: { 
                id: parseInt(id),
                usuario_id: usuarioId // Asegurar que solo pueda ver sus propias transacciones
            },
            include: [
                {
                    model: Activo,
                    attributes: ['id', 'nombre', 'simbolo']
                }
            ]
        });
        
        if (!transaccion) {
            console.log('❌ Transacción no encontrada o no pertenece al usuario');
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }
        
        console.log('✅ Transacción encontrada:', transaccion.id);
        
        res.status(200).json({
            transaccion,
            mensaje: 'Transacción obtenida exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error al obtener transacción por ID:', error);
        res.status(500).json({ 
            error: 'Error al obtener la transacción',
            details: error.message 
        });
    }
};
