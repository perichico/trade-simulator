/**
 * Script para configurar manualmente las relaciones de la base de datos
 * Este script se puede ejecutar después de la inicialización para establecer relaciones
 */

const bcrypt = require('bcrypt');
const { sequelize } = require('../models/index');

async function setupDatabase() {
  try {
    console.log('Iniciando configuración manual de la base de datos...');
    
    // Verificar conexión
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    // Sincronizar modelos
    await sequelize.sync({ force: false });
    console.log('Modelos sincronizados correctamente.');
    
    // Verificar si ya existen usuarios
    const { Usuario } = require('../models/index');
    const usuariosExistentes = await Usuario.count();
    
    if (usuariosExistentes === 0) {
      console.log('No hay usuarios en el sistema. Creando usuarios de prueba...');
      
      // Crear contraseñas hasheadas
      const adminPassword = await bcrypt.hash('admin123', 10);
      const userPassword = await bcrypt.hash('user123', 10);
      
      // Crear usuarios de prueba
      await Usuario.bulkCreate([
        {
          nombre: 'Administrador',
          email: 'admin@admin.com',
          contrasena: adminPassword,
          rol: 'admin',
          estado: 'activo'
        },
        {
          nombre: 'Usuario de Prueba',
          email: 'user@test.com',
          contrasena: userPassword,
          rol: 'usuario',
          estado: 'activo'
        },
        {
          nombre: 'Test User',
          email: 'test@test.com',
          contrasena: userPassword,
          rol: 'usuario',
          estado: 'activo'
        }
      ]);
      
      console.log('✅ Usuarios de prueba creados:');
      console.log('📧 Admin: admin@admin.com / admin123');
      console.log('📧 User: user@test.com / user123');
      console.log('📧 Test: test@test.com / user123');
      
      // Crear portafolios para los usuarios
      const { Portafolio } = require('../models/index');
      const usuarios = await Usuario.findAll();
      
      for (const usuario of usuarios) {
        await Portafolio.create({
          nombre: 'Portafolio Principal',
          usuario_id: usuario.id,
          saldo: 10000.00
        });
      }
      
      console.log('✅ Portafolios creados para todos los usuarios');
    } else {
      console.log(`Ya existen ${usuariosExistentes} usuarios en el sistema.`);
    }
    
    // Ejecutar SQL directamente para añadir claves foráneas
    await sequelize.query(`
      -- Añadir clave foránea a la tabla activo
      ALTER TABLE activo
      ADD CONSTRAINT fk_activo_tipo_activo
      FOREIGN KEY (tipo_activo_id) 
      REFERENCES tipo_activo(id);
      
      -- Añadir clave foránea a la tabla dividendo
      ALTER TABLE dividendo
      ADD CONSTRAINT fk_dividendo_activo
      FOREIGN KEY (activo_id) 
      REFERENCES activo(id) 
      ON DELETE CASCADE 
      ON UPDATE CASCADE;
    `).catch(err => {
      console.log('Aviso: Las claves foráneas ya existen o hubo un problema al crearlas:', err.message);
    });
    
    console.log('Configuración manual completada.');
  } catch (error) {
    console.error('Error en la configuración manual:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Si este script se ejecuta directamente
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Proceso finalizado.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error en el proceso principal:', err);
      process.exit(1);
    });
}

module.exports = setupDatabase;
