const { sequelize, Usuario, Portafolio } = require("../models/index");

async function migrarSaldoAPortafolio() {
    const transaction = await sequelize.transaction();
    
    try {
        console.log("Iniciando migración de saldos de usuarios a portafolios...");
        
        // Obtener todos los usuarios
        const usuarios = await Usuario.findAll();
        console.log(`Se encontraron ${usuarios.length} usuarios para procesar`);
        
        // Para cada usuario, transferir su saldo a su portafolio principal
        for (const usuario of usuarios) {
            console.log(`Procesando usuario: ${usuario.nombre} (ID: ${usuario.id})`);
            
            // Buscar el portafolio principal del usuario
            let portafolio = await Portafolio.findOne({
                where: { usuario_id: usuario.id },
                order: [['id', 'ASC']]
            });
            
            // Si no tiene portafolio, crear uno
            if (!portafolio) {
                portafolio = await Portafolio.create({
                    nombre: "Portafolio Principal",
                    usuario_id: usuario.id,
                    saldo: usuario.balance || 10000.00 // Usar el saldo del usuario o el valor por defecto
                }, { transaction });
                console.log(`Creado nuevo portafolio ID: ${portafolio.id} con saldo: ${portafolio.saldo}`);
            } else {
                // Actualizar el saldo del portafolio con el balance del usuario
                await portafolio.update({ 
                    saldo: usuario.balance || 10000.00 
                }, { transaction });
                console.log(`Actualizado portafolio ID: ${portafolio.id} con saldo: ${portafolio.saldo}`);
            }
        }
        
        await transaction.commit();
        console.log("Migración de saldos completada con éxito");
        
    } catch (error) {
        await transaction.rollback();
        console.error("Error durante la migración de saldos:", error);
    } finally {
        // Cerrar la conexión
        await sequelize.close();
    }
}

// Ejecutar la migración
migrarSaldoAPortafolio()
    .then(() => console.log("Proceso de migración finalizado"))
    .catch(err => console.error("Error en el proceso de migración:", err));