const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("historial_precios", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        activo_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "activos",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        fecha: { type: DataTypes.DATE, allowNull: false }
    }, {
        tableName: "historial_precios",
        timestamps: false
    });
};