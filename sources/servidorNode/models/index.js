const sequelize = require('../database/db');
const { Op } = require('sequelize');

// Importar modelos
const Usuario = require('./usuarioModel');
const TipoActivo = require('./tipoActivoModel');
const Activo = require('./activoModel');
const Portafolio = require('./portafolioModel');
const PortafolioActivo = require('./portafolioActivoModel');
const HistorialPrecios = require('./historialPreciosModel');
const Dividendo = require('./dividendoModel');
const Orden = require('./ordenModel');
const Alerta = require('./alertaModel');
const Transaccion = require('./transaccionModel');

// Inicializar modelos
const UsuarioModel = Usuario(sequelize);
const TipoActivoModel = TipoActivo(sequelize);
const ActivoModel = Activo(sequelize);
const PortafolioModel = Portafolio(sequelize);
const PortafolioActivoModel = PortafolioActivo(sequelize);
const HistorialPreciosModel = HistorialPrecios(sequelize);
const DividendoModel = Dividendo(sequelize);
const OrdenModel = Orden(sequelize);
const AlertaModel = Alerta(sequelize);
const TransaccionModel = Transaccion(sequelize);

// Definir relaciones
// Relaciones principales con índices optimizados
TipoActivoModel.hasMany(ActivoModel, { foreignKey: 'tipo_activo_id', onDelete: 'RESTRICT', constraints: false });
ActivoModel.belongsTo(TipoActivoModel, { foreignKey: 'tipo_activo_id', targetKey: 'id', constraints: false });

UsuarioModel.hasMany(PortafolioModel, { foreignKey: 'usuario_id', constraints: false });
PortafolioModel.belongsTo(UsuarioModel, { foreignKey: 'usuario_id', constraints: false });

// Relaciones many-to-many con índices optimizados
PortafolioModel.belongsToMany(ActivoModel, { through: PortafolioActivoModel, foreignKey: 'portafolio_id', constraints: false });
ActivoModel.belongsToMany(PortafolioModel, { through: PortafolioActivoModel, foreignKey: 'activo_id', constraints: false });

// Relaciones con Activo optimizadas
ActivoModel.hasMany(HistorialPreciosModel, { foreignKey: 'activo_id', constraints: false });
HistorialPreciosModel.belongsTo(ActivoModel, { foreignKey: 'activo_id', constraints: false });

ActivoModel.hasMany(DividendoModel, { foreignKey: 'activo_id', constraints: false });
DividendoModel.belongsTo(ActivoModel, { foreignKey: 'activo_id', constraints: false });

// Relaciones de Órdenes y Alertas
UsuarioModel.hasMany(OrdenModel, { foreignKey: 'usuario_id', constraints: false });
OrdenModel.belongsTo(UsuarioModel, { foreignKey: 'usuario_id', constraints: false });
ActivoModel.hasMany(OrdenModel, { foreignKey: 'activo_id', constraints: false });
OrdenModel.belongsTo(ActivoModel, { foreignKey: 'activo_id', constraints: false });

UsuarioModel.hasMany(AlertaModel, { foreignKey: 'usuario_id', constraints: false });
AlertaModel.belongsTo(UsuarioModel, { foreignKey: 'usuario_id', constraints: false });
ActivoModel.hasMany(AlertaModel, { foreignKey: 'activo_id', constraints: false });
AlertaModel.belongsTo(ActivoModel, { foreignKey: 'activo_id', constraints: false });

// Relaciones de Transacciones
UsuarioModel.hasMany(TransaccionModel, { foreignKey: 'usuario_id', constraints: false });
TransaccionModel.belongsTo(UsuarioModel, { foreignKey: 'usuario_id', constraints: false });
ActivoModel.hasMany(TransaccionModel, { foreignKey: 'activo_id', constraints: false });
TransaccionModel.belongsTo(ActivoModel, { foreignKey: 'activo_id', constraints: false });

module.exports = {
    sequelize,
    Usuario: UsuarioModel,
    TipoActivo: TipoActivoModel,
    Activo: ActivoModel,
    Portafolio: PortafolioModel,
    PortafolioActivo: PortafolioActivoModel,
    HistorialPrecios: HistorialPreciosModel,
    Dividendo: DividendoModel,
    Orden: OrdenModel,
    Alerta: AlertaModel,
    Transaccion: TransaccionModel,
    Op
};
