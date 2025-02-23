const sequelize = require('../database/db'); 
const { DataTypes } = require('sequelize');
const { Usuario } = require('./usuarioModel'); 
const { Activo } = require('./activoModel'); 

const Transaccion = sequelize.define('Transaccion', {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Tipo: {
        type: DataTypes.STRING(50),
        allowNull: false // Compra o venta
    },
    Cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    UsuarioID: {
        type: DataTypes.INTEGER,
        references: {
            model: Usuario,
            key: 'ID'
        },
        onDelete: 'CASCADE'
    },
    ActivoID: {
        type: DataTypes.INTEGER,
        references: {
            model: Activo,
            key: 'ID'
        },
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'transacciones',
    timestamps: false
});

// Relaciones
Transaccion.belongsTo(Usuario, { foreignKey: 'UsuarioID' });
Transaccion.belongsTo(Activo, { foreignKey: 'ActivoID' });

module.exports = { Transaccion };
