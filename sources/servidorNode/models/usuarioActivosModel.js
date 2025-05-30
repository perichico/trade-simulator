const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Obtener los modelos ya definidos
    const Usuario = sequelize.models.usuario;
    const Activo = sequelize.models.activo;

    const UsuarioActivos = sequelize.define('UsuarioActivos', {
        UsuarioID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'usuarios',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        ActivoID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'activos',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        Cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: 'usuario_activos',
        timestamps: false
    });

    return UsuarioActivos;
};