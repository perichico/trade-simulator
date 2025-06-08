const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define("PortafolioActivo", {
        portafolio_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "portafolio",
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
        cantidad: {
            type: DataTypes.DECIMAL(15, 6),
            allowNull: false,
            defaultValue: 0
        },
        precio_compra: {
            type: DataTypes.DECIMAL(15, 6),
            allowNull: true,
            defaultValue: 0,
            comment: 'Precio promedio ponderado de compra'
        },
        fecha_compra: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
            comment: 'Fecha de la última compra'
        }
    }, {
        tableName: "portafolio_activo",
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['portafolio_id', 'activo_id']
            }
        ]
    });
};