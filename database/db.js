const Sequelize = require('sequelize');

const sequelize = new Sequelize('bolsa', 'lubuntu', 'Lubuntu1!', {  //Configuramos la base de datos
    host: '127.0.0.1',
    dialect: 'mysql'
});

sequelize.sync()    //Sincronizamos la base de datos
    .then(() => console.log('Base de datos sincronizada'))
    .catch((error) => console.log('Error al sincronizar la base de datos'));

module.exports = sequelize;