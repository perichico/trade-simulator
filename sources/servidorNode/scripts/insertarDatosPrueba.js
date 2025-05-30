const bcrypt = require('bcrypt');
const { sequelize, Usuario, TipoActivo, Activo, Portafolio } = require('../models/index');

async function insertarDatosPrueba() {
    const transaction = await sequelize.transaction();
    
    try {
        console.log('Iniciando inserción de datos de prueba...');
        
        // Verificar si ya existen usuarios
        const usuariosExistentes = await Usuario.count();
        if (usuariosExistentes > 0) {
            console.log('Ya existen usuarios en el sistema, cancelando inserción de datos de prueba');
            await transaction.rollback();
            return;
        }
        
        // Crear contraseñas hasheadas
        const passwordHash = await bcrypt.hash('password123', 10);
        const adminPasswordHash = await bcrypt.hash('admin123', 10);
        
        // Insertar usuarios de prueba
        const usuarios = await Usuario.bulkCreate([
            {
                nombre: 'Usuario de Prueba',
                email: 'usuario@test.com',
                contrasena: passwordHash,
                rol: 'usuario',
                estado: 'activo',
                fechaRegistro: new Date(),
                fechaActualizacion: new Date()
            },
            {
                nombre: 'Administrador',
                email: 'admin@test.com',
                contrasena: adminPasswordHash,
                rol: 'admin',
                estado: 'activo',
                fechaRegistro: new Date(),
                fechaActualizacion: new Date()
            },
            {
                nombre: 'Test User',
                email: 'test@test.com',
                contrasena: passwordHash,
                rol: 'usuario',
                estado: 'activo',
                fechaRegistro: new Date(),
                fechaActualizacion: new Date()
            }
        ], { transaction });
        
        console.log('Usuarios de prueba creados:', usuarios.length);
        
        // Crear portafolios para los usuarios
        for (const usuario of usuarios) {
            await Portafolio.create({
                nombre: 'Portafolio Principal',
                usuario_id: usuario.id,
                saldo: 10000.00
            }, { transaction });
        }
        
        console.log('Portafolios creados para los usuarios');
        
        await transaction.commit();
        console.log('Datos de prueba insertados correctamente');
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error al insertar datos de prueba:', error);
        throw error;
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    insertarDatosPrueba()
        .then(() => {
            console.log('Proceso completado');
            process.exit(0);
        })
        .catch(err => {
            console.error('Error en el proceso:', err);
            process.exit(1);
        });
}

module.exports = insertarDatosPrueba;
