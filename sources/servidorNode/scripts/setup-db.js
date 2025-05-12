/**
 * Script para configurar manualmente las relaciones de la base de datos
 * Este script se puede ejecutar después de la inicialización para establecer relaciones
 */

const { sequelize } = require('../models/index');

async function setupDatabase() {
  try {
    console.log('Iniciando configuración manual de la base de datos...');
    
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
