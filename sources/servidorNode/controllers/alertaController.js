const { Alerta, Activo, Usuario, Transaccion } = require('../models/index');
const transaccionController = require('./transaccionController');
const HistorialPreciosService = require('../services/historialPreciosService');

// Obtener todas las alertas de un usuario
exports.obtenerAlertas = async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const alertas = await Alerta.findAll({
            where: { usuario_id: usuarioId },
            include: [Activo],
            order: [['fecha_creacion', 'DESC']]
        });
        res.status(200).json(alertas);
    } catch (error) {
        console.error('Error al obtener alertas:', error);
        res.status(500).json({ error: 'Error al obtener las alertas' });
    }
};

// Crear una nueva alerta
exports.crearAlerta = async (req, res) => {
    try {
        const { activo_id, precio_objetivo, condicion, cantidad_venta } = req.body;
        const usuario_id = req.session.usuario.id;

        if (!activo_id || !precio_objetivo || !condicion || !cantidad_venta) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        const alerta = await Alerta.create({
            usuario_id,
            activo_id,
            precio_objetivo,
            condicion,
            cantidad_venta,
            estado: 'activa',
            fecha_creacion: new Date()
        });

        res.status(201).json(alerta);
    } catch (error) {
        console.error('Error al crear alerta:', error);
        res.status(500).json({ error: 'Error al crear la alerta' });
    }
};

// Verificar alertas y ejecutar ventas automáticas
exports.verificarAlertas = async () => {
    try {
        const alertasActivas = await Alerta.findAll({
            where: { estado: 'activa' },
            include: [Activo, Usuario]
        });

        const historialService = new HistorialPreciosService();

        for (const alerta of alertasActivas) {
            const precioActual = await historialService.obtenerUltimoPrecio(alerta.activo_id);
            
            if (!precioActual) continue;

            const condicionCumplida = alerta.condicion === 'mayor' ?
                precioActual >= alerta.precio_objetivo :
                precioActual <= alerta.precio_objetivo;

            if (condicionCumplida) {
                // Ejecutar venta automática
                const ventaAutomatica = {
                    activoId: alerta.activo_id,
                    tipo: 'venta',
                    cantidad: alerta.cantidad_venta,
                    session: { usuario: { id: alerta.usuario_id } }
                };

                try {
                    await transaccionController.crearTransaccion(ventaAutomatica, {
                        status: () => {},
                        json: () => {}
                    });

                    // Actualizar estado de la alerta
                    await alerta.update({
                        estado: 'disparada',
                        fecha_disparo: new Date()
                    });

                    console.log(`Alerta ejecutada: Venta automática de ${alerta.cantidad_venta} unidades del activo ${alerta.activo_id}`);
                } catch (error) {
                    console.error('Error al ejecutar venta automática:', error);
                }
            }
        }
    } catch (error) {
        console.error('Error al verificar alertas:', error);
    }
};

// Cancelar una alerta
exports.cancelarAlerta = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.session.usuario.id;

        const alerta = await Alerta.findOne({
            where: { id, usuario_id }
        });

        if (!alerta) {
            return res.status(404).json({ error: 'Alerta no encontrada' });
        }

        await alerta.update({ estado: 'cancelada' });
        res.status(200).json({ mensaje: 'Alerta cancelada exitosamente' });
    } catch (error) {
        console.error('Error al cancelar alerta:', error);
        res.status(500).json({ error: 'Error al cancelar la alerta' });
    }
};