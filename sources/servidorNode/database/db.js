const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de Sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});

// Verificar conexión
sequelize.authenticate()
    .then(() => console.log('Conexión exitosa a la base de datos'))
    .catch(error => console.error('Error en la conexión:', error));

// Sincronizar la base de datos con los modelos
sequelize.sync({ alter: true })
    .then(() => console.log('Base de datos sincronizada'))
    .catch(error => console.error('Error al sincronizar la base de datos:', error));

module.exports = sequelize;