const { sequelize, Usuario, Activo, Portafolio, PortafolioActivo } = require("../models/index");

// Obtener todos los portafolios de un usuario
exports.obtenerPortafoliosUsuario = async (req, res) => {
    try {
        // Verificar si el usuario está autenticado
        if (!req.session.usuario) {
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

        const usuarioId = req.session.usuario.id;

        // Buscar todos los portafolios del usuario
        const portafolios = await Portafolio.findAll({
            where: { usuario_id: usuarioId },
            order: [['id', 'ASC']]
        });

        // Si no tiene portafolios, crear uno por defecto
        if (portafolios.length === 0) {
            const nuevoPortafolio = await Portafolio.create({
                nombre: "Portafolio Principal",
                usuario_id: usuarioId,
                descripcion: "Mi portafolio principal de inversiones",
                saldo: 10000.00 // Saldo inicial por defecto
            });
            portafolios.push(nuevoPortafolio);
        }

        // Transformar los datos para el frontend
        const portafoliosFormateados = await Promise.all(portafolios.map(async (portafolio) => {
            const valorTotal = await this.calcularValorPortafolio(portafolio.id);
            return {
                id: portafolio.id,
                nombre: portafolio.nombre,
                descripcion: portafolio.descripcion,
                fechaCreacion: new Date(), // Usando fecha actual ya que la tabla no tiene timestamps
                valorTotal,
                saldo: portafolio.saldo
            };
        }));

        res.status(200).json(portafoliosFormateados);
    } catch (error) {
        console.error('Error al obtener los portafolios del usuario:', error);
        res.status(500).json({ error: "Error al obtener los portafolios" });
    }
};

// Obtener un portafolio específico por su ID
exports.obtenerPortafolio = async (req, res) => {
    try {
        // Verificar si el usuario está autenticado
        if (!req.session.usuario) {
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

        const usuarioId = req.session.usuario.id;
        const portafolioId = req.params.id;
        
        console.log(`Obteniendo portafolio ID: ${portafolioId} para usuario ID: ${usuarioId}`);

        // Buscar el portafolio específico
        const portafolio = await Portafolio.findOne({
            where: { 
                id: portafolioId,
                usuario_id: usuarioId 
            }
        });

        if (!portafolio) {
            console.log(`Portafolio no encontrado con ID: ${portafolioId}`);
            return res.status(404).json({ error: "Portafolio no encontrado" });
        }
        
        console.log(`Portafolio encontrado: ${portafolio.nombre}`);

        // Obtener los activos del portafolio con manejo de errores mejorado
        let activosEnPortafolio = [];
        try {
            activosEnPortafolio = await PortafolioActivo.findAll({
                where: { portafolio_id: portafolioId },
                attributes: {
                    include: [
                        [sequelize.literal('COALESCE(precio_compra, 0)'), 'precio_compra_safe'],
                        [sequelize.literal('COALESCE(fecha_compra, NOW())'), 'fecha_compra_safe']
                    ]
                }
            });
        } catch (queryError) {
            console.warn('Error al obtener activos con columnas adicionales, usando query básico:', queryError.message);
            // Fallback: obtener sin las columnas adicionales
            activosEnPortafolio = await PortafolioActivo.findAll({
                where: { portafolio_id: portafolioId }
            });
        }
        
        console.log(`Activos encontrados en portafolio: ${activosEnPortafolio.length}`);
        
        // Si no hay activos, verificar si hay transacciones para migrar
        if (activosEnPortafolio.length === 0) {
            const { Transaccion } = require("../models/index");
            const transaccionesUsuario = await Transaccion.findAll({
                where: { usuario_id: usuarioId },
                attributes: ['id', 'activo_id', 'tipo', 'cantidad', 'precio']
            });
            
            console.log(`Transacciones del usuario: ${transaccionesUsuario.length}`);

            if (transaccionesUsuario.length > 0 && portafolio.nombre === 'Portafolio Principal') {
                console.log('Ejecutando migración manual de transacciones a portafolio principal...');
                
                // Agrupar transacciones por activo y calcular precio promedio
                const activosPorId = {};
                
                for (const transaccion of transaccionesUsuario) {
                    const { activo_id, cantidad, tipo, precio } = transaccion;
                    
                    if (!activosPorId[activo_id]) {
                        activosPorId[activo_id] = {
                            cantidadTotal: 0,
                            costoTotal: 0,
                            precioPromedio: 0
                        };
                    }
                    
                    if (tipo === 'compra') {
                        activosPorId[activo_id].cantidadTotal += cantidad;
                        activosPorId[activo_id].costoTotal += (cantidad * precio);
                    } else if (tipo === 'venta') {
                        activosPorId[activo_id].cantidadTotal -= cantidad;
                    }
                }
                
                // Calcular precio promedio y crear/actualizar registros
                for (const [activoId, datos] of Object.entries(activosPorId)) {
                    if (datos.cantidadTotal > 0) {
                        const precioPromedio = datos.costoTotal / datos.cantidadTotal;
                        
                        try {
                            await PortafolioActivo.upsert({
                                portafolio_id: portafolio.id,
                                activo_id: activoId,
                                cantidad: datos.cantidadTotal,
                                precio_compra: precioPromedio,
                                fecha_compra: new Date()
                            });
                            console.log(`Migrado activo ID: ${activoId} con cantidad: ${datos.cantidadTotal} y precio: ${precioPromedio}`);
                        } catch (upsertError) {
                            console.warn(`Error al migrar activo ${activoId}, usando INSERT básico:`, upsertError.message);
                            // Fallback: crear sin campos adicionales
                            await PortafolioActivo.findOrCreate({
                                where: {
                                    portafolio_id: portafolio.id,
                                    activo_id: activoId
                                },
                                defaults: {
                                    cantidad: datos.cantidadTotal
                                }
                            });
                        }
                    }
                }
                
                // Volver a obtener los activos después de la migración
                activosEnPortafolio = await PortafolioActivo.findAll({
                    where: { portafolio_id: portafolio.id }
                });
            }
        }

        // Obtener detalles de los activos y calcular rendimientos
        const activos = [];
        
        for (const item of activosEnPortafolio) {
            try {
                const activo = await Activo.findByPk(item.activo_id, {
                    attributes: ['id', 'nombre', 'simbolo', 'ultimo_precio'],
                    include: [{
                        model: require("../models/index").TipoActivo,
                        attributes: ['id', 'nombre'],
                        required: false
                    }]
                });
                
                if (activo) {
                    // Obtener precio de compra de manera segura
                    let precioCompra = 0;
                    
                    // Verificar si las columnas precio_compra existen
                    if (item.dataValues && typeof item.dataValues.precio_compra !== 'undefined') {
                        precioCompra = parseFloat(item.precio_compra) || 0;
                    } else if (item.precio_compra_safe) {
                        precioCompra = parseFloat(item.precio_compra_safe) || 0;
                    }
                    
                    // Si no hay precio de compra, calcularlo desde transacciones
                    if (precioCompra === 0) {
                        const { Transaccion } = require("../models/index");
                        const transacciones = await Transaccion.findAll({
                            where: { 
                                usuario_id: usuarioId,
                                activo_id: activo.id,
                                tipo: 'compra'
                            },
                            order: [['fecha', 'ASC']]
                        });
                        
                        if (transacciones.length > 0) {
                            let cantidadTotal = 0;
                            let costoTotal = 0;
                            
                            transacciones.forEach(t => {
                                cantidadTotal += t.cantidad;
                                costoTotal += t.cantidad * t.precio;
                            });
                            
                            precioCompra = cantidadTotal > 0 ? costoTotal / cantidadTotal : 0;
                        }
                    }
                    
                    const precioActual = parseFloat(activo.ultimo_precio) || 0;
                    const cantidad = parseFloat(item.cantidad) || 0;
                    const valorTotal = cantidad * precioActual;
                    const rendimiento = (precioActual - precioCompra) * cantidad;
                    const rendimientoPorcentaje = precioCompra > 0 ? ((precioActual - precioCompra) / precioCompra) * 100 : 0;
                    
                    activos.push({
                        id: activo.id,
                        nombre: activo.nombre,
                        simbolo: activo.simbolo,
                        cantidad: cantidad,
                        precioCompra: parseFloat(precioCompra.toFixed(2)),
                        precioActual: precioActual,
                        valorTotal: parseFloat(valorTotal.toFixed(2)),
                        rendimiento: parseFloat(rendimiento.toFixed(2)),
                        rendimientoPorcentaje: parseFloat(rendimientoPorcentaje.toFixed(2)),
                        activoId: activo.id // Para compatibilidad con el frontend
                    });
                }
            } catch (activoError) {
                console.error(`Error al procesar activo ${item.activo_id}:`, activoError.message);
                // Continuar con el siguiente activo en caso de error
            }
        }

        // Calcular totales
        const valorTotal = activos.reduce((total, activo) => total + activo.valorTotal, 0);
        const rendimientoTotal = activos.reduce((total, activo) => total + activo.rendimiento, 0);

        console.log(`Enviando respuesta con ${activos.length} activos`);
        
        res.status(200).json({
            id: portafolio.id,
            nombre: portafolio.nombre,
            descripcion: portafolio.descripcion || '',
            saldo: parseFloat(portafolio.saldo) || 0,
            activos,
            valorTotal: parseFloat(valorTotal.toFixed(2)),
            rendimientoTotal: parseFloat(rendimientoTotal.toFixed(2))
        });
        
    } catch (error) {
        console.error('Error detallado al obtener el portafolio:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: "Error al obtener el portafolio",
            details: error.message 
        });
    }
};

// Método para calcular el valor total de un portafolio
exports.calcularValorPortafolio = async (portafolioId) => {
    try {
        const activosEnPortafolio = await PortafolioActivo.findAll({
            where: { portafolio_id: portafolioId }
        });
        
        // Obtener los detalles de los activos por separado
        const activosConDetalles = [];
        for (const item of activosEnPortafolio) {
            const activo = await Activo.findByPk(item.activo_id, {
                attributes: ['id', 'ultimo_precio']
            });
            if (activo) {
                activosConDetalles.push({
                    ...item.toJSON(),
                    activo
                });
            }
        }

        return activosConDetalles.reduce((total, item) => {
            return total + (item.cantidad * (item.activo.ultimo_precio || 0));
        }, 0);
    } catch (error) {
        console.error('Error al calcular valor del portafolio:', error);
        return 0;
    }
};

// Crear un nuevo portafolio
exports.crearPortafolio = async (req, res) => {
    try {
        // Verificar si el usuario está autenticado
        if (!req.session.usuario) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }

        const usuarioId = req.session.usuario.id;
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: "El nombre del portafolio es obligatorio" });
        }

        // Crear el nuevo portafolio
        const nuevoPortafolio = await Portafolio.create({
            nombre,
            usuario_id: usuarioId,
            saldo: 10000.00 // Asignar saldo inicial de 10,000
        });

        // Guardar el ID del nuevo portafolio en la sesión del usuario
        req.session.portafolioSeleccionado = nuevoPortafolio.id;

        res.status(201).json({
            id: nuevoPortafolio.id,
            nombre: nuevoPortafolio.nombre,
            descripcion: nuevoPortafolio.descripcion,
            fechaCreacion: new Date(),
            valorTotal: 0, // Valor inicial es 0 ya que no tiene activos
            saldo: 10000.00, // Saldo inicial
            activos: []
        });
    } catch (error) {
        console.error('Error al crear nuevo portafolio:', error);
        res.status(500).json({ error: "Error al crear el portafolio" });
    }
};

// Seleccionar un portafolio como activo
exports.seleccionarPortafolio = async (req, res) => {
    try {
        // Verificar si el usuario está autenticado
        if (!req.session.usuario) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }

        const usuarioId = req.session.usuario.id;
        const portafolioId = parseInt(req.params.id);

        // Verificar que el portafolio exista y pertenezca al usuario
        const portafolio = await Portafolio.findOne({
            where: { 
                id: portafolioId,
                usuario_id: usuarioId 
            }
        });

        if (!portafolio) {
            return res.status(404).json({ error: "Portafolio no encontrado" });
        }

        // Guardar el ID del portafolio seleccionado en la sesión del usuario
        req.session.portafolioSeleccionado = portafolioId;
        console.log(`Usuario ${usuarioId} seleccionó el portafolio ${portafolioId}`);

        res.status(200).json({
            mensaje: "Portafolio seleccionado correctamente",
            portafolioId
        });
    } catch (error) {
        console.error('Error al seleccionar portafolio:', error);
        res.status(500).json({ error: "Error al seleccionar el portafolio" });
    }
};

// Actualizar el portafolio después de una transacción
exports.actualizarPortafolio = async (usuarioId, activoId, cantidad, transaction, portafolioId = null) => {
    // Obtener el portafolio del usuario
    let portafolio;
    
    if (portafolioId) {
        portafolio = await Portafolio.findOne({
            where: { 
                id: portafolioId,
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
        throw new Error("Portafolio no encontrado");
    }
    try {
        console.log(`Actualizando portafolio - Usuario: ${usuarioId}, Activo: ${activoId}, Cantidad: ${cantidad}, PortafolioID: ${portafolioId}`);
        
        // Reutilizamos la variable portafolio ya declarada al inicio del método
        // Si se proporcionó un ID de portafolio específico, actualizar la búsqueda con transaction
        if (portafolioId) {
            // Buscar el portafolio específico con transaction
            portafolio = await Portafolio.findOne({
                where: { 
                    id: portafolioId,
                    usuario_id: usuarioId 
                },
                transaction
            });
        }
        
        // Si no se encontró el portafolio específico o no se proporcionó ID, usar el principal
        if (!portafolio) {
            // Buscar el portafolio principal del usuario
            [portafolio] = await Portafolio.findOrCreate({
                where: { 
                    usuario_id: usuarioId,
                    nombre: "Portafolio Principal"
                },
                defaults: {
                    nombre: "Portafolio Principal",
                    usuario_id: usuarioId,
                    descripcion: "Mi portafolio principal de inversiones"
                },
                transaction
            });
        }

        console.log(`Portafolio encontrado/creado: ${portafolio.id}`);

        // Buscar si ya existe el activo en el portafolio
        let activoEnPortafolio = await PortafolioActivo.findOne({
            where: {
                portafolio_id: portafolio.id,
                activo_id: activoId
            },
            transaction
        });

        if (activoEnPortafolio) {
            // Actualizar la cantidad
            const nuevaCantidad = activoEnPortafolio.cantidad + cantidad;
            console.log(`Activo encontrado en portafolio. Cantidad actual: ${activoEnPortafolio.cantidad}, Nueva cantidad: ${nuevaCantidad}`);
            
            if (nuevaCantidad > 0) {
                // Si la cantidad es positiva, actualizar
                await activoEnPortafolio.update({ cantidad: nuevaCantidad }, { transaction });
                console.log(`Cantidad actualizada a: ${nuevaCantidad}`);
            } else {
                // Si la cantidad es cero o negativa, eliminar el registro
                await activoEnPortafolio.destroy({ transaction });
                console.log(`Activo eliminado del portafolio por cantidad cero o negativa`);
            }
        } else if (cantidad > 0) {
            // Si no existe y la cantidad es positiva, crear nuevo registro
            const nuevoActivoPortafolio = await PortafolioActivo.create({
                portafolio_id: portafolio.id,
                activo_id: activoId,
                cantidad
            }, { transaction });
            console.log(`Nuevo activo añadido al portafolio con cantidad: ${cantidad}`);
        } else {
            console.log(`No se realizó ninguna acción: el activo no existe en el portafolio y la cantidad es ${cantidad}`);
        }

        return true;
    } catch (error) {
        console.error('Error al actualizar el portafolio:', error);
        throw error;
    }
};

// Eliminar todos los activos asociados a un portafolio
exports.eliminarActivosDePortafolio = async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }
        const usuarioId = req.session.usuario.id;
        const portafolioId = req.params.id;
        // Verificar que el portafolio pertenezca al usuario
        const portafolio = await Portafolio.findOne({
            where: { id: portafolioId, usuario_id: usuarioId }
        });
        if (!portafolio) {
            return res.status(404).json({ error: "Portafolio no encontrado" });
        }
        // Eliminar todos los activos asociados a este portafolio
        await PortafolioActivo.destroy({ where: { portafolio_id: portafolioId } });
        return res.status(200).json({ mensaje: "Activos eliminados correctamente del portafolio" });
    } catch (error) {
        console.error('Error al eliminar los activos del portafolio:', error);
        return res.status(500).json({ error: "Error al eliminar los activos del portafolio" });
    }
};

// Eliminar un portafolio completo (incluyendo sus activos)
exports.eliminarPortafolio = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        if (!req.session.usuario) {
            await transaction.rollback();
            return res.status(401).json({ error: "Usuario no autenticado" });
        }
        
        const usuarioId = req.session.usuario.id;
        const portafolioId = req.params.id;
        
        console.log(`Intentando eliminar portafolio ID: ${portafolioId} del usuario ID: ${usuarioId}`);
        
        // Verificar que el portafolio pertenezca al usuario
        const portafolio = await Portafolio.findOne({
            where: { id: portafolioId, usuario_id: usuarioId },
            transaction
        });
        
        if (!portafolio) {
            await transaction.rollback();
            return res.status(404).json({ error: "Portafolio no encontrado" });
        }
        
        // Verificar que no sea el portafolio principal
        const esPortafolioPrincipal = await Portafolio.findOne({
            where: { usuario_id: usuarioId },
            order: [['id', 'ASC']],
            limit: 1,
            transaction
        });
        
        if (esPortafolioPrincipal && esPortafolioPrincipal.id === parseInt(portafolioId)) {
            await transaction.rollback();
            return res.status(400).json({ error: "No se puede eliminar el portafolio principal" });
        }
        
        // Primero eliminar todos los activos asociados a este portafolio
        await PortafolioActivo.destroy({ 
            where: { portafolio_id: portafolioId },
            transaction 
        });
        
        console.log(`Activos del portafolio ${portafolioId} eliminados correctamente`);
        
        // Luego eliminar el portafolio
        await portafolio.destroy({ transaction });
        
        console.log(`Portafolio ${portafolioId} eliminado correctamente`);
        
        await transaction.commit();
        
        return res.status(200).json({ mensaje: "Portafolio eliminado correctamente" });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al eliminar el portafolio:', error);
        return res.status(500).json({ error: "Error al eliminar el portafolio" });
    }
};