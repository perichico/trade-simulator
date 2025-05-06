/**
 * Script para ejecutar la migración que añade la columna 'saldo' a la tabla 'portafolio'
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function ejecutarMigracion() {
  // Configuración de la conexión a la base de datos
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'usuario',
    password: process.env.DB_PASS || 'usuario',
    database: process.env.DB_NAME || 'bolsa'
  });

  try {
    console.log('Conectado a la base de datos. Ejecutando migración...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'add_saldo_to_portafolio.sql');
    const sqlQuery = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar la consulta SQL
    await conexion.query(sqlQuery);
    
    console.log('Migración completada con éxito. La columna "saldo" ha sido añadida a la tabla "portafolio".');
  } catch (error) {
    console.error('Error al ejecutar la migración:', error.message);
    
    // Verificar si el error es porque la columna ya existe
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('La columna "saldo" ya existe en la tabla "portafolio".');
    }
  } finally {
    // Cerrar la conexión
    await conexion.end();
    console.log('Conexión cerrada.');
  }
}

// Ejecutar la migración
ejecutarMigracion();