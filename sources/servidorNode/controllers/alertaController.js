const { Alerta, Activo, Usuario, Transaccion } = require('../models/index');
const transaccionController = require('./transaccionController');
const HistorialPreciosService = require('../services/historialPreciosService');

// Obtener todas las alertas de un usuario
exports.obtenerAlertas = async (req, res) => {
    try {
        // Verificar si el usuario está suspendido
        if (req.session.usuario.estado === 'suspendido') {
            return res.status(403).json({ 
                error: "Usuario suspendido",
                tipo: "USUARIO_SUSPENDIDO",
                mensaje: "Tu cuenta ha sido suspendida. Contacta al administrador para más información."
            });
        }

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
        // Verificar si el usuario está suspendido
        if (req.session.usuario.estado === 'suspendido') {
            return res.status(403).json({ 
                error: "Usuario suspendido",
                tipo: "USUARIO_SUSPENDIDO",
                mensaje: "Tu cuenta ha sido suspendida. Contacta al administrador para más información."
            });
        }

        const { activo_id, precio_objetivo, condicion, cantidad_venta, portafolio_id } = req.body;
        const usuario_id = req.session.usuario.id;

        // Validación más estricta de datos requeridos
        if (!activo_id || !precio_objetivo || !condicion || !cantidad_venta || !portafolio_id) {
            return res.status(400).json({ 
                error: 'Todos los campos son requeridos: activo, precio objetivo, condición, cantidad a vender y portafolio' 
            });
        }

        if (cantidad_venta <= 0) {
            return res.status(400).json({ 
                error: 'La cantidad a vender debe ser mayor a 0' 
            });
        }

        if (precio_objetivo <= 0) {
            return res.status(400).json({ 
                error: 'El precio objetivo debe ser mayor a 0' 
            });
        }

        // Verificar que el portafolio pertenezca al usuario
        const { Portafolio, PortafolioActivo } = require('../models/index');
        const portafolio = await Portafolio.findOne({
            where: { id: portafolio_id, usuario_id: usuario_id }
        });

        if (!portafolio) {
            return res.status(400).json({
                error: 'El portafolio especificado no te pertenece'
            });
        }

        // Verificar que el usuario tenga suficientes activos en el portafolio específico
        const posicion = await PortafolioActivo.findOne({
            where: {
                portafolio_id: portafolio_id,
                activo_id: activo_id
            }
        });

        const cantidadDisponible = posicion ? parseFloat(posicion.cantidad) : 0;

        if (cantidadDisponible < cantidad_venta) {
            return res.status(400).json({
                error: `No tienes suficientes activos en este portafolio. Tienes ${cantidadDisponible} unidades, necesitas ${cantidad_venta}.`
            });
        }

        // Obtener precio actual para verificar si la alerta ya se cumple
        const HistorialPreciosService = require('../services/historialPreciosService');
        const historialService = new HistorialPreciosService();
        const precioActual = await historialService.obtenerUltimoPrecio(activo_id);

        const alerta = await Alerta.create({
            usuario_id,
            portafolio_id,
            activo_id,
            precio_objetivo,
            condicion,
            cantidad_venta,
            estado: 'activa',
            fecha_creacion: new Date()
        });

        // Verificar si la alerta ya se cumple al momento de crearla
        if (precioActual) {
            const condicionCumplida = condicion === 'mayor' ?
                precioActual >= precio_objetivo :
                precioActual <= precio_objetivo;

            if (condicionCumplida) {
                console.log(`🚨 ALERTA CUMPLIDA AL CREAR: ID ${alerta.id} - Ejecutando venta inmediata`);
                
                try {
                    const resultadoVenta = await transaccionController.ejecutarVentaAutomatica(
                        usuario_id,
                        activo_id,
                        cantidad_venta,
                        precioActual,
                        portafolio_id
                    );

                    // Actualizar estado de la alerta
                    await alerta.update({
                        estado: 'disparada',
                        activa: false,
                        fecha_disparo: new Date()
                    });

                    return res.status(201).json({
                        alerta,
                        mensaje: 'Alerta creada y ejecutada inmediatamente',
                        venta_ejecutada: true,
                        resultado_venta: resultadoVenta
                    });

                } catch (ventaError) {
                    console.error(`❌ Error al ejecutar venta inmediata:`, ventaError.message);
                    
                    // Cancelar la alerta si no se puede ejecutar
                    await alerta.update({
                        estado: 'cancelada',
                        activa: false
                    });

                    return res.status(400).json({
                        error: `Alerta creada pero no se pudo ejecutar la venta: ${ventaError.message}`
                    });
                }
            }
        }

        res.status(201).json({
            alerta,
            mensaje: 'Alerta creada exitosamente',
            venta_ejecutada: false
        });
    } catch (error) {
        console.error('Error al crear alerta:', error);
        res.status(500).json({ error: 'Error al crear la alerta' });
    }
};

// Verificar alertas y ejecutar ventas automáticas
exports.verificarAlertas = async () => {
    try {
        const alertasActivas = await Alerta.findAll({
            where: { 
                estado: 'activa',
                activa: true
            },
            include: [
                { model: require('../models/index').Activo, as: 'activo' },
                { model: require('../models/index').Usuario, as: 'usuario' },
                { model: require('../models/index').Portafolio, as: 'portafolio' }
            ]
        });

        console.log(`Verificando ${alertasActivas.length} alertas activas...`);
        const historialService = new HistorialPreciosService();

        for (const alerta of alertasActivas) {
            try {
                const precioActual = await historialService.obtenerUltimoPrecio(alerta.activo_id);
                
                if (!precioActual) {
                    console.log(`No hay precio disponible para activo ${alerta.activo_id}`);
                    continue;
                }

                const condicionCumplida = alerta.condicion === 'mayor' ?
                    precioActual >= alerta.precio_objetivo :
                    precioActual <= alerta.precio_objetivo;

                console.log(`Alerta ${alerta.id}: Precio actual $${precioActual}, Objetivo $${alerta.precio_objetivo}, Condición: ${alerta.condicion}, Cumplida: ${condicionCumplida}`);

                if (condicionCumplida) {
                    console.log(`🚨 ALERTA DISPARADA: ID ${alerta.id} - Vendiendo ${alerta.cantidad_venta} unidades del activo ${alerta.activo_id} del portafolio ${alerta.portafolio_id}`);

                    try {
                        const resultadoVenta = await transaccionController.ejecutarVentaAutomatica(
                            alerta.usuario_id,
                            alerta.activo_id,
                            alerta.cantidad_venta,
                            precioActual,
                            alerta.portafolio_id
                        );

                        // Actualizar estado de la alerta
                        await alerta.update({
                            estado: 'disparada',
                            activa: false,
                            fecha_disparo: new Date()
                        });

                        console.log(`✅ Alerta ${alerta.id} ejecutada exitosamente:`);
                        console.log(`   - Usuario: ${alerta.usuario.nombre}`);
                        console.log(`   - Portafolio: ${alerta.portafolio.nombre}`);
                        console.log(`   - Activo: ${alerta.activo.simbolo}`);
                        console.log(`   - Cantidad vendida: ${resultadoVenta.cantidadVendida}`);
                        console.log(`   - Valor total: $${resultadoVenta.valorTotal.toFixed(2)}`);

                    } catch (ventaError) {
                        console.error(`❌ Error al ejecutar venta automática para alerta ${alerta.id}:`, ventaError.message);
                        
                        // Si no tiene suficientes activos, cancelar la alerta
                        if (ventaError.message.includes('suficientes activos') || 
                            ventaError.message.includes('No se encontraron activos')) {
                            await alerta.update({
                                estado: 'cancelada',
                                activa: false
                            });
                            console.log(`⚠️ Alerta ${alerta.id} cancelada automáticamente: ${ventaError.message}`);
                        }
                    }
                }
            } catch (alertaError) {
                console.error(`Error al procesar alerta ${alerta.id}:`, alertaError);
            }
        }
    } catch (error) {
        console.error('Error general al verificar alertas:', error);
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