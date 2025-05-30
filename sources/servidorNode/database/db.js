const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('Configurando conexión a la base de datos...');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);

// Configuración de Sequelize con opciones optimizadas
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS || process.env.DB_PASSWORD, {
  define: {
    timestamps: true,
    freezeTableName: true,
    indexes: [] // Deshabilitar la creación automática de índices
  },
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Cambiar a console.log para debug si es necesario
    dialectOptions: {
        timezone: '+00:00',
        dateStrings: true,
        typeCast: true
    },
    timezone: '+00:00',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Verificar conexión
sequelize.authenticate()
    .then(() => {
        console.log('✅ Conexión exitosa a la base de datos');
    })
    .catch(error => {
        console.error('❌ Error en la conexión:', error);
        console.error('Detalles:', error.message);
    });

// NO sincronizar automáticamente para evitar conflictos con la base de datos existente
console.log('ℹ️ Sincronización automática deshabilitada para preservar estructura existente');

module.exports = sequelize;