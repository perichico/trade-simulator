const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("alerta", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "usuarios",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        activo_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "activos",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        precio_objetivo: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        condicion: {
            type: DataTypes.ENUM('mayor', 'menor'),
            allowNull: false
        },
        estado: {
            type: DataTypes.ENUM('activa', 'disparada', 'cancelada'),
            allowNull: false
        },
        fecha_creacion: { type: DataTypes.DATE, allowNull: false },
        fecha_disparo: { type: DataTypes.DATE }
    }, {
        tableName: "alertas",
        timestamps: false
    });
};