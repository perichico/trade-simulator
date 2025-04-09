const { Sequelize } = require("sequelize");
require("dotenv").config();

// Configuración de Sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false
});

// Verificar conexión
sequelize.authenticate()
    .then(() => console.log("Conexión exitosa a la base de datos"))
    .catch(error => console.error("Error en la conexión:", error));

// Importar modelos
const Usuario = require("./usuarioModel")(sequelize);
const Activo = require("./activoModel")(sequelize);
const Transaccion = require("./transaccionModel")(sequelize);

// Definir relaciones
Usuario.hasMany(Transaccion, { foreignKey: "usuarioId" });
Transaccion.belongsTo(Usuario, { foreignKey: "usuarioId" });

Activo.hasMany(Transaccion, { foreignKey: "activoId" });
Transaccion.belongsTo(Activo, { foreignKey: "activoId" });

// Sincronizar la base de datos con los modelos
sequelize.sync({ alter: true }) // Esto garantiza que las tablas se sincronicen con los modelos
    .then(() => console.log('Base de datos sincronizada'))
    .catch(error => console.error('Error al sincronizar la base de datos:', error));

module.exports = { sequelize, Usuario, Activo, Transaccion };
