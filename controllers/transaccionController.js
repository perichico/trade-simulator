const { sequelize, Usuario, Activo, Transaccion } = require("../models/index");

// Obtener todas las transacciones
exports.obtenerTransacciones = async (req, res) => {
  try {
    const transacciones = await Transaccion.findAll({
      include: [Usuario, Activo],
    });
    res.json(transacciones);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las transacciones" });
  }
};

// Crear una nueva transacción (Compra/Venta)
exports.crearTransaccion = async (req, res) => {
    try {
      // Obtener el usuarioId desde la sesión
      const usuarioId = req.session.usuario.id;
  
      // Obtener los datos del formulario
      const { activoId, tipo, cantidad } = req.body;
  
      // Verificar si el usuario está autenticado
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }
  
      // Verificar si el usuario y el activo existen
      const usuario = await Usuario.findByPk(usuarioId);
      const activo = await Activo.findByPk(activoId);
      if (!usuario || !activo) {
        return res.status(404).json({ error: "Usuario o activo no encontrado" });
      }
  
      // Obtener el precio del activo en el momento de la transacción
      const precioEnTransaccion = activo.precio;
      const costoTotal = precioEnTransaccion * cantidad;
  
      // Lógica de compra
      if (tipo === "compra") {
        if (usuario.balance < costoTotal) {
          return res.status(400).json({ error: "Saldo insuficiente" });
        }
        await usuario.update({ balance: usuario.balance - costoTotal });
  
        // Registrar transacción de compra
        await Transaccion.create({
          usuarioId,
          activoId,
          tipo,
          cantidad,
          precio: precioEnTransaccion,
          fecha: new Date(), // Fecha actual
        });
  
        return res.redirect("/dashboard");
      }
  
      // Lógica de venta
      if (tipo === "venta") {
        // Verificar cuántos activos tiene el usuario
        const cantidadActivosUsuario = await Transaccion.sum("cantidad", {
          where: {
            usuarioId,
            activoId,
          },
        });
  
        // Si no tiene suficientes activos para vender
        if (cantidadActivosUsuario < cantidad) {
          return res.status(400).json({ error: "No tienes suficientes activos para vender" });
        }
  
        // Actualizar el balance del usuario
        await usuario.update({ balance: usuario.balance + costoTotal });
  
        // Registrar transacción de venta
        await Transaccion.create({
          usuarioId,
          activoId,
          tipo,
          cantidad: -cantidad, // Como es una venta, la cantidad será negativa
          precio: precioEnTransaccion,
          fecha: new Date(), // Fecha actual
        });
  
        return res.redirect("/dashboard");
      }
  
      // Si el tipo no es válido
      return res.status(400).json({ error: "Tipo de transacción inválido" });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error al registrar la transacción" });
    }
  };
  

// Obtener transacciones de un usuario
exports.obtenerTransaccionesPorUsuario = async (req, res) => {
  try {
    const transacciones = await Transaccion.findAll({
      where: { usuarioId: req.params.usuarioId },
      include: [Activo],
    });
    res.json(transacciones);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener las transacciones del usuario" });
  }
};
