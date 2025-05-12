const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function ejecutarMigracion() {
    console.log('Iniciando migración para añadir campos de dividendos...');
    
    // Leer el archivo SQL
    const rutaArchivo = path.join(__dirname, 'add_dividend_fields_to_activos.sql');
    const contenidoSQL = fs.readFileSync(rutaArchivo, 'utf8');
    
    // Conectar a la base de datos
    const conexion = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'test',
        multipleStatements: true // Importante para ejecutar múltiples consultas
    });
    
    try {
        // Ejecutar el script SQL
        console.log('Ejecutando script de migración...');
        await conexion.query(contenidoSQL);
        console.log('Migración completada exitosamente.');
    } catch (error) {
        console.error('Error al ejecutar la migración:', error);
    } finally {
        // Cerrar la conexión
        await conexion.end();
    }
}

// Ejecutar la migración
ejecutarMigracion();