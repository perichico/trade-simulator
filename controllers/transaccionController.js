const { Transaccion } = require('../models/transaccionModel');
const { Usuario } = require('../models/usuarioModel');
const { Activo } = require('../models/activoModel');
const { UsuarioActivos } = require('../models/usuarioActivosModel');
const yahooFinance = require('yahoo-finance2').default;

// Obtener transacciones de un usuario
const obtenerTransacciones = async (req, res) => {
    try {
        const usuarioId = req.params.usuarioId;

        const transacciones = await Transaccion.findAll({
            where: { UsuarioID: usuarioId },
            include: [
                { model: Usuario, attributes: ['Nombre', 'Correo'] },
                { model: Activo, attributes: ['Nombre', 'Tipo'] }
            ]
        });

        res.render('listadoTransacciones', { transacciones });
    } catch (error) {
        console.error('Error obteniendo transacciones:', error);
        res.status(500).json({ error: 'Error obteniendo transacciones' });
    }
};

// Comprar activo
const comprarActivo = async (req, res) => {
    try {
        const { activoId, cantidadDinero } = req.body;
        if (!activoId || !cantidadDinero) {
            return res.status(400).json({ error: 'Faltan datos: activoId o cantidadDinero' });
        }

        const usuarioId = req.user.id;
        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const activo = await Activo.findByPk(activoId);
        if (!activo) {
            return res.status(404).json({ error: 'Activo no encontrado' });
        }

        const quote = await yahooFinance.quote(activo.Nombre);
        const precioActivo = quote.regularMarketPrice;

        if (cantidadDinero > usuario.Saldo) {
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }

        const cantidadActivos = cantidadDinero / precioActivo;
        usuario.Saldo -= cantidadDinero;
        await usuario.save();

        await Transaccion.create({
            Tipo: 'compra',
            Cantidad: cantidadActivos,
            UsuarioID: usuarioId,
            ActivoID: activoId
        });

        const usuarioActivo = await UsuarioActivos.findOne({
            where: { UsuarioID: usuarioId, ActivoID: activoId }
        });

        if (usuarioActivo) {
            usuarioActivo.Cantidad += cantidadActivos;
            await usuarioActivo.save();
        } else {
            await UsuarioActivos.create({
                UsuarioID: usuarioId,
                ActivoID: activoId,
                Cantidad: cantidadActivos
            });
        }

        res.redirect('/activos');
    } catch (error) {
        console.error('Error al comprar activo:', error);
        res.status(500).json({ error: 'Error al comprar activo' });
    }
};

// Vender activo
const venderActivo = async (req, res) => {
    try {
        const { activoId, cantidadActivos } = req.body;
        if (!activoId || !cantidadActivos) {
            return res.status(400).json({ error: 'Faltan datos: activoId o cantidadActivos' });
        }

        const usuarioId = req.user.id;
        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const activo = await Activo.findByPk(activoId);
        if (!activo) {
            return res.status(404).json({ error: 'Activo no encontrado' });
        }

        const quote = await yahooFinance.quote(activo.Nombre);
        const precioActivo = quote.regularMarketPrice;

        const usuarioActivo = await UsuarioActivos.findOne({
            where: { UsuarioID: usuarioId, ActivoID: activoId }
        });

        if (!usuarioActivo || usuarioActivo.Cantidad < cantidadActivos) {
            return res.status(400).json({ error: 'No tienes suficientes activos para vender' });
        }

        usuarioActivo.Cantidad -= cantidadActivos;
        if (usuarioActivo.Cantidad === 0) {
            await usuarioActivo.destroy();
        } else {
            await usuarioActivo.save();
        }

        const dineroObtenido = cantidadActivos * precioActivo;
        usuario.Saldo += dineroObtenido;
        await usuario.save();

        await Transaccion.create({
            Tipo: 'venta',
            Cantidad: cantidadActivos,
            UsuarioID: usuarioId,
            ActivoID: activoId
        });

        res.redirect('/activos');
    } catch (error) {
        console.error('Error al vender activo:', error);
        res.status(500).json({ error: 'Error al vender activo' });
    }
};

// Exportar los controladores
module.exports = {
    obtenerTransacciones,
    comprarActivo,
    venderActivo
};
