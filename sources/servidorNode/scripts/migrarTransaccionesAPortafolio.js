/**
 * Script para migrar las transacciones existentes al sistema de portafolio
 * Este script debe ejecutarse una sola vez para inicializar los portafolios
 * de los usuarios basados en sus transacciones históricas.
 */

const { sequelize, Usuario, Transaccion, Portafolio, PortafolioActivo } = require("../models/index");

async function migrarTransaccionesAPortafolio() {
    const transaction = await sequelize.transaction();
    
    try {
        console.log("Iniciando migración de transacciones a portafolios...");
        
        // Obtener todos los usuarios
        const usuarios = await Usuario.findAll();
        console.log(`Se encontraron ${usuarios.length} usuarios para procesar`);
        
        // Para cada usuario, procesar sus transacciones
        for (const usuario of usuarios) {
            console.log(`Procesando usuario: ${usuario.nombre} (ID: ${usuario.id})`);
            
            // Buscar o crear el portafolio del usuario
            let [portafolio] = await Portafolio.findOrCreate({
                where: { usuario_id: usuario.id },
                defaults: {
                    nombre: "Portafolio Principal",
                    usuario_id: usuario.id
                },
                transaction
            });
            
            console.log(`Portafolio ID: ${portafolio.id}`);
            
            // Obtener todas las transacciones del usuario
            const transacciones = await Transaccion.findAll({
                where: { usuario_id: usuario.id },
                transaction
            });
            
            console.log(`Se encontraron ${transacciones.length} transacciones`);
            
            // Agrupar transacciones por activo
            const activosPorId = {};
            
            for (const transaccion of transacciones) {
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
                    // Calcular precio promedio de compra basado en transacciones
                    const transaccionesCompra = transacciones.filter(t => 
                        t.activo_id == activoId && t.tipo === 'compra'
                    );
                    
                    let precioPromedio = 0;
                    let fechaUltimaCompra = new Date();
                    
                    if (transaccionesCompra.length > 0) {
                        const totalInvertido = transaccionesCompra.reduce((total, t) => 
                            total + (t.cantidad * t.precio), 0
                        );
                        const totalCantidad = transaccionesCompra.reduce((total, t) => 
                            total + t.cantidad, 0
                        );
                        
                        precioPromedio = totalCantidad > 0 ? totalInvertido / totalCantidad : 0;
                        fechaUltimaCompra = new Date(Math.max(...transaccionesCompra.map(t => new Date(t.fecha))));
                    }
                    
                    // Verificar si ya existe el registro
                    const existente = await PortafolioActivo.findOne({
                        where: {
                            portafolio_id: portafolio.id,
                            activo_id: activoId
                        },
                        transaction
                    });
                    
                    if (existente) {
                        // Actualizar con precio y fecha calculados
                        await existente.update({ 
                            cantidad,
                            precio_compra: precioPromedio,
                            fecha_compra: fechaUltimaCompra
                        }, { transaction });
                        console.log(`Actualizado activo ID: ${activoId} - Cantidad: ${cantidad} - Precio promedio: ${precioPromedio}`);
                    } else {
                        // Crear nuevo registro con precio y fecha
                        await PortafolioActivo.create({
                            portafolio_id: portafolio.id,
                            activo_id: activoId,
                            cantidad,
                            precio_compra: precioPromedio,
                            fecha_compra: fechaUltimaCompra
                        }, { transaction });
                        console.log(`Creado activo ID: ${activoId} - Cantidad: ${cantidad} - Precio promedio: ${precioPromedio}`);
                    }
                }
            }
            
            console.log(`Procesamiento completado para usuario ID: ${usuario.id}`);
        }
        
        await transaction.commit();
        console.log("Migración completada con éxito");
        
    } catch (error) {
        await transaction.rollback();
        console.error("Error durante la migración:", error);
    } finally {
        // Cerrar la conexión
        await sequelize.close();
    }
}

// Ejecutar la migración
migrarTransaccionesAPortafolio()
    .then(() => console.log("Proceso finalizado"))
    .catch(err => console.error("Error en el proceso principal:", err));