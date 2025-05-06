const { sequelize, Usuario, Activo, Portafolio, PortafolioActivo } = require("../models/index");

// Obtener todos los portafolios de un usuario
exports.obtenerPortafoliosUsuario = async (req, res) => {
    try {
        // Verificar si el usuario está autenticado
        if (!req.session.usuario) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }

        const usuarioId = req.session.usuario.id;

        // Buscar todos los portafolios del usuario
        const portafolios = await Portafolio.findAll({
            where: { usuario_id: usuarioId },
            order: [['id', 'ASC']] // Cambiado de 'createdAt' a 'id' ya que la tabla no tiene timestamps
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
                saldo: portafolio.saldo // <-- Añadido saldo aquí
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

        // Obtener los activos del portafolio con sus cantidades
        const activosEnPortafolio = await PortafolioActivo.findAll({
            where: { portafolio_id: portafolio.id }
        });
        
        // Obtener los detalles de los activos por separado
        const activosConDetalles = [];
        for (const item of activosEnPortafolio) {
            const activo = await Activo.findByPk(item.activo_id, {
                attributes: ['id', 'nombre', 'simbolo', 'ultimo_precio']
            });
            if (activo) {
                activosConDetalles.push({
                    ...item.toJSON(),
                    activo
                });
            }
        }
        
        console.log(`Activos encontrados en portafolio: ${activosEnPortafolio.length}`);
        
        // Si no hay activos, verificar si hay transacciones para este usuario
        if (activosEnPortafolio.length === 0) {
            const { Transaccion } = require("../models/index");
            const transaccionesUsuario = await Transaccion.findAll({
                where: { usuario_id: usuarioId },
                attributes: ['id', 'activo_id', 'tipo', 'cantidad']
            });
            
            console.log(`Transacciones del usuario: ${transaccionesUsuario.length}`);
            
            // Si hay transacciones pero no hay activos en el portafolio, ejecutar migración manual
            // Solo para el portafolio principal, los nuevos portafolios deben empezar vacíos
            if (transaccionesUsuario.length > 0 && portafolio.nombre === 'Portafolio Principal') {
                console.log('Ejecutando migración manual de transacciones a portafolio principal...');
                
                // Agrupar transacciones por activo
                const activosPorId = {};
                
                for (const transaccion of transaccionesUsuario) {
                    const { activo_id, cantidad, tipo } = transaccion;
                    
                    if (!activosPorId[activo_id]) {
                        activosPorId[activo_id] = 0;
                    }
                    
                    // Sumar o restar según el tipo de transacción
                    if (tipo === 'compra') {
                        activosPorId[activo_id] += cantidad;
                    } else if (tipo === 'venta') {
                        activosPorId[activo_id] -= cantidad;
                    }
                }
                
                // Actualizar o crear registros en portafolio_activo
                for (const [activoId, cantidad] of Object.entries(activosPorId)) {
                    if (cantidad > 0) {
                        // Verificar si ya existe el registro
                        const existente = await PortafolioActivo.findOne({
                            where: {
                                portafolio_id: portafolio.id,
                                activo_id: activoId
                            }
                        });
                        
                        if (existente) {
                            // Actualizar cantidad
                            await existente.update({ cantidad });
                            console.log(`Actualizado activo ID: ${activoId} con cantidad: ${cantidad}`);
                        } else {
                            // Crear nuevo registro
                            await PortafolioActivo.create({
                                portafolio_id: portafolio.id,
                                activo_id: activoId,
                                cantidad
                            });
                            console.log(`Creado activo ID: ${activoId} con cantidad: ${cantidad}`);
                        }
                    }
                }
                
                // Volver a obtener los activos después de la migración
                const activosActualizados = await PortafolioActivo.findAll({
                    where: { portafolio_id: portafolio.id }
                });
                
                // Obtener los detalles de los activos por separado
                const activosConDetallesActualizados = [];
                for (const item of activosActualizados) {
                    const activo = await Activo.findByPk(item.activo_id, {
                        attributes: ['id', 'nombre', 'simbolo', 'ultimo_precio']
                    });
                    if (activo) {
                        activosConDetallesActualizados.push({
                            ...item.toJSON(),
                            activo
                        });
                    }
                }
                
                console.log(`Activos después de migración: ${activosActualizados.length}`);
                
                // Usar los activos actualizados
                if (activosConDetallesActualizados.length > 0) {
                    activosEnPortafolio = activosConDetallesActualizados;
                }
            }
        }

        // Importar el servicio de transacciones para calcular el precio promedio de compra
        const { Transaccion } = require("../models/index");
        
        // Transformar los datos para el frontend
        const activos = await Promise.all(activosConDetalles.map(async item => {
            // Calcular el precio promedio de compra basado en las transacciones
            const transacciones = await Transaccion.findAll({
                where: { 
                    usuario_id: usuarioId,
                    activo_id: item.activo.id
                },
                order: [['fecha', 'ASC']]
            });
            
            console.log(`Transacciones para activo ${item.activo.id}: ${transacciones.length}`);
            
            // Calcular precio promedio de compra
            let cantidadTotal = 0;
            let costoTotal = 0;
            
            transacciones.forEach(t => {
                if (t.tipo === 'compra') {
                    cantidadTotal += t.cantidad;
                    costoTotal += t.cantidad * t.precio;
                } else if (t.tipo === 'venta') {
                    cantidadTotal -= t.cantidad;
                    // No restamos del costo total para mantener el precio promedio de compra
                }
            });
            
            const precioCompra = cantidadTotal > 0 ? costoTotal / cantidadTotal : 0;
            const precioActual = item.activo.ultimo_precio || 0;
            const valorTotal = item.cantidad * precioActual;
            const rendimiento = (precioActual - precioCompra) * item.cantidad;
            const rendimientoPorcentaje = precioCompra > 0 ? ((precioActual - precioCompra) / precioCompra) * 100 : 0;
            
            return {
                id: item.activo.id,
                nombre: item.activo.nombre,
                simbolo: item.activo.simbolo,
                cantidad: item.cantidad,
                precioCompra,
                precioActual,
                valorTotal,
                rendimiento,
                rendimientoPorcentaje
            };
        }));

        // Calcular el valor total del portafolio y el rendimiento total
        const valorTotal = activos.reduce((total, activo) => total + activo.valorTotal, 0);
        const rendimientoTotal = activos.reduce((total, activo) => total + activo.rendimiento, 0);

        console.log(`Enviando respuesta con ${activos.length} activos`);
        
        // Incluir el saldo del portafolio en la respuesta
        res.status(200).json({
            id: portafolio.id,
            nombre: portafolio.nombre,
            descripcion: portafolio.descripcion,
            saldo: portafolio.saldo,
            activos,
            valorTotal,
            rendimientoTotal
        });
    } catch (error) {
        console.error('Error al obtener el portafolio:', error);
        res.status(500).json({ error: "Error al obtener el portafolio" });
    }
};

// Método auxiliar para calcular el valor total de un portafolio
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
            usuario_id: usuarioId
        });

        // Guardar el ID del nuevo portafolio en la sesión del usuario
        req.session.portafolioSeleccionado = nuevoPortafolio.id;

        // Asignar un saldo inicial fijo de 10,000 para cada nuevo portafolio
        res.status(201).json({
            id: nuevoPortafolio.id,
            nombre: nuevoPortafolio.nombre,
            fechaCreacion: new Date(), // Usando fecha actual ya que la tabla no tiene timestamps
            valorTotal: 10000, // Saldo inicial fijo de 10,000
            activos: [] // Sin activos iniciales
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
        
        // Si no se especifica un portafolio, usar el portafolio principal o el último seleccionado
        let portafolio;
        
        if (portafolioId) {
            // Buscar el portafolio específico
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

        console.log(`Portafolio encontrado/creado: ${portafolio.id}`);

        // Buscar si ya existe el activo en el portafolio
        let activoEnPortafolio = await PortafolioActivo.findOne({
            where: {
                portafolio_id: portafolio.id,
                activo_id: activoId
            },
        });
            transaction
        };

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