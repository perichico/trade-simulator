const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("alerta", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        usuarioId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'usuario_id',
            references: {
                model: "usuarios",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        activoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'activo_id',
            references: {
                model: "activos",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        precioObjetivo: { 
            type: DataTypes.DECIMAL(10, 2), 
            allowNull: false,
            field: 'precio_objetivo'
        },
        cantidadVenta: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'cantidad_venta'
        },
        condicion: {
            type: DataTypes.ENUM('mayor', 'menor'),
            allowNull: false,
            defaultValue: 'mayor'
        },
        estado: {
            type: DataTypes.ENUM('activa', 'disparada', 'cancelada'),
            allowNull: false,
            defaultValue: 'activa'
        },
        activa: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        fechaCreacion: { 
            type: DataTypes.DATE, 
            allowNull: false,
            field: 'fecha_creacion',
            defaultValue: DataTypes.NOW
        },
        fechaDisparo: { 
            type: DataTypes.DATE,
            field: 'fecha_disparo'
        }
    }, {
        tableName: "alertas",
        timestamps: false
    });
};