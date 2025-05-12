const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("activo", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: { type: DataTypes.STRING(255), allowNull: false },
        simbolo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        tipo_activo_id: { type: DataTypes.INTEGER, allowNull: false },
        ultimo_precio: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        ultima_actualizacion: { type: DataTypes.DATE, allowNull: true },
        porcentaje_dividendo: { 
            type: DataTypes.DECIMAL(5, 2), 
            allowNull: true, 
            defaultValue: 0.00,
            comment: 'Porcentaje de dividendo que paga el activo'
        },
        frecuencia_dividendo: { 
            type: DataTypes.ENUM('mensual', 'trimestral', 'semestral', 'anual'), 
            allowNull: true,
            comment: 'Frecuencia con la que se pagan los dividendos'
        },
        ultima_fecha_dividendo: { 
            type: DataTypes.DATE, 
            allowNull: true,
            comment: 'Última fecha en que se pagó un dividendo'
        }
    }, {
        tableName: "activos",
        timestamps: false
    });
};
