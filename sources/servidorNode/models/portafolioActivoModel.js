const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("portafolio_activo", {
        portafolio_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: "portafolio",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        activo_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: "activos",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        tableName: "portafolio_activo",
        timestamps: false
    });
};