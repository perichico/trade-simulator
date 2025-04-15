const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("orden", {
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
        tipo: {
            type: DataTypes.ENUM('compra', 'venta'),
            allowNull: false
        },
        cantidad: { type: DataTypes.INTEGER, allowNull: false },
        precio_limite: { type: DataTypes.DECIMAL(10, 2) },
        estado: {
            type: DataTypes.ENUM('pendiente', 'ejecutada', 'cancelada'),
            allowNull: false
        },
        fecha_creacion: { type: DataTypes.DATE, allowNull: false },
        fecha_ejecucion: { type: DataTypes.DATE }
    }, {
        tableName: "ordenes",
        timestamps: false
    });
};