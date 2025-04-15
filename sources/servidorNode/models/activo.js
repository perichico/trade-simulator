const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Activo = sequelize.define('activo', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    simbolo: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    tipo_activo_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tipos_activos',
            key: 'id'
        }
    },
    ultimo_precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    ultima_actualizacion: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'activos',
    timestamps: false
});

// Asegurarse de que el modelo esté sincronizado con la base de datos
Activo.sync({ alter: false })
    .then(() => console.log('Modelo Activo sincronizado'))
    .catch(error => console.error('Error al sincronizar modelo Activo:', error));

module.exports = Activo;