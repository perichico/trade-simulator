/**
 * Script para ejecutar la migración que añade las columnas precio_compra y fecha_compra
 * a la tabla portafolio_activo
 */

const { sequelize } = require('../models/index');
const fs = require('fs');
const path = require('path');

async function ejecutarMigracion() {
    const transaction = await sequelize.transaction();
    
    try {
        console.log('=== INICIANDO MIGRACIÓN DE PORTAFOLIO_ACTIVO ===');
        
        // Leer el archivo SQL de migración
        const sqlFile = path.join(__dirname, 'add_precio_compra_to_portafolio_activo.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        // Ejecutar cada statement SQL
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
            console.log('Ejecutando:', statement);
            await sequelize.query(statement, { transaction });
        }
        
        await transaction.commit();
        console.log('✅ Migración completada exitosamente');
        
        // Verificar estructura de la tabla
        const [results] = await sequelize.query("DESCRIBE portafolio_activo");
        console.log('📋 Estructura actual de portafolio_activo:');
        console.table(results);
        
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error en la migración:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    ejecutarMigracion()
        .then(() => {
            console.log('Proceso completado');
            process.exit(0);
        })
        .catch(error => {
            console.error('Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { ejecutarMigracion };
