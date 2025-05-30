const sequelize = require('../database/db');
const { Op } = require('sequelize');

// Importar y inicializar todos los modelos con sequelize
const Usuario = require('./usuarioModel')(sequelize);
const TipoActivo = require('./tipoActivoModel')(sequelize);
const Activo = require('./activoModel')(sequelize);
const Portafolio = require('./portafolioModel')(sequelize);
const PortafolioActivo = require('./portafolioActivoModel')(sequelize);
const HistorialPrecios = require('./historialPreciosModel')(sequelize);
const Dividendo = require('./dividendoModel')(sequelize);
const Orden = require('./ordenModel')(sequelize);
const Alerta = require('./alertaModel')(sequelize);
const Transaccion = require('./transaccionModel')(sequelize);

// Definir relaciones después de que todos los modelos estén creados
const defineRelaciones = () => {
    // TipoActivo - Activo
    TipoActivo.hasMany(Activo, { foreignKey: 'tipo_activo_id', onDelete: 'RESTRICT', constraints: false });
    Activo.belongsTo(TipoActivo, { foreignKey: 'tipo_activo_id', targetKey: 'id', constraints: false });

    // Usuario - Portafolio
    Usuario.hasMany(Portafolio, { foreignKey: 'usuario_id', constraints: false });
    Portafolio.belongsTo(Usuario, { foreignKey: 'usuario_id', constraints: false });

    // Portafolio - Activo (many-to-many)
    Portafolio.belongsToMany(Activo, { through: PortafolioActivo, foreignKey: 'portafolio_id', constraints: false });
    Activo.belongsToMany(Portafolio, { through: PortafolioActivo, foreignKey: 'activo_id', constraints: false });

    // Relaciones directas para PortafolioActivo
    Portafolio.hasMany(PortafolioActivo, { foreignKey: 'portafolio_id', as: 'portafolioActivos', constraints: false });
    PortafolioActivo.belongsTo(Portafolio, { foreignKey: 'portafolio_id', constraints: false });
    
    Activo.hasMany(PortafolioActivo, { foreignKey: 'activo_id', constraints: false });
    PortafolioActivo.belongsTo(Activo, { foreignKey: 'activo_id', as: 'activo', constraints: false });

    // Activo - HistorialPrecios
    Activo.hasMany(HistorialPrecios, { foreignKey: 'activo_id', constraints: false });
    HistorialPrecios.belongsTo(Activo, { foreignKey: 'activo_id', constraints: false });

    // Activo - Dividendo
    Activo.hasMany(Dividendo, { foreignKey: 'activo_id', constraints: false });
    Dividendo.belongsTo(Activo, { foreignKey: 'activo_id', constraints: false });

    // Usuario - Orden
    Usuario.hasMany(Orden, { foreignKey: 'usuario_id', constraints: false });
    Orden.belongsTo(Usuario, { foreignKey: 'usuario_id', constraints: false });
    
    // Activo - Orden
    Activo.hasMany(Orden, { foreignKey: 'activo_id', constraints: false });
    Orden.belongsTo(Activo, { foreignKey: 'activo_id', constraints: false });

    // Usuario - Alerta
    Usuario.hasMany(Alerta, { foreignKey: 'usuario_id', constraints: false });
    Alerta.belongsTo(Usuario, { foreignKey: 'usuario_id', constraints: false });
    
    // Activo - Alerta
    Activo.hasMany(Alerta, { foreignKey: 'activo_id', constraints: false });
    Alerta.belongsTo(Activo, { foreignKey: 'activo_id', constraints: false });

    // Usuario - Transaccion
    Usuario.hasMany(Transaccion, { foreignKey: 'usuario_id', constraints: false });
    Transaccion.belongsTo(Usuario, { foreignKey: 'usuario_id', constraints: false });
    
    // Activo - Transaccion
    Activo.hasMany(Transaccion, { foreignKey: 'activo_id', constraints: false });
    Transaccion.belongsTo(Activo, { foreignKey: 'activo_id', constraints: false });
};

// Ejecutar definición de relaciones
defineRelaciones();

// Exportar modelos y sequelize
module.exports = {
    sequelize,
    Op,
    Usuario,
    TipoActivo,
    Activo,
    Portafolio,
    PortafolioActivo,
    HistorialPrecios,
    Dividendo,
    Orden,
    Alerta,
    Transaccion
};
