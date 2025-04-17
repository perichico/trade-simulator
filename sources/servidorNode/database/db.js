const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de Sequelize con opciones optimizadas
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  define: {
    timestamps: false,
    freezeTableName: true,
    indexes: [] // Deshabilitar la creación automática de índices
  },
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});

// Verificar conexión
sequelize.authenticate()
    .then(() => console.log('Conexión exitosa a la base de datos'))
    .catch(error => console.error('Error en la conexión:', error));

// Sincronizar la base de datos con los modelos
sequelize.sync({ alter: false, force: false })
    .then(() => console.log('Base de datos sincronizada'))
    .catch(error => {
        console.error('Error al sincronizar la base de datos:', error);
        process.exit(1);
    });

module.exports = sequelize;