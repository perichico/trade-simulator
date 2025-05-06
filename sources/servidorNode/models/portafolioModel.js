const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("portafolio", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: { type: DataTypes.STRING, allowNull: false },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "usuarios",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        saldo: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 10000.00 }
    }, {
        tableName: "portafolio",
        timestamps: false
    });
};