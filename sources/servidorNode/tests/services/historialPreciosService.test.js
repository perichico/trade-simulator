const HistorialPreciosService = require('../../services/historialPreciosService');

// Mock del modelo HistorialPrecios
jest.mock('../../models/index', () => ({
  HistorialPrecios: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn()
  },
  Activo: {
    findByPk: jest.fn()
  },
  Alerta: {
    findAll: jest.fn()
  },
  Op: {
    gte: Symbol('gte'),
    between: Symbol('between')
  }
}));

const { HistorialPrecios, Activo, Alerta } = require('../../models/index');

describe('HistorialPreciosService', () => {
  let historialService;

  beforeEach(() => {
    historialService = new HistorialPreciosService();
    jest.clearAllMocks();
  });

  describe('calcularVariacionPorcentual', () => {
    test('debería retornar 0 cuando el precio actual no es válido', async () => {
      const resultado = await historialService.calcularVariacionPorcentual(1, 0);
      expect(resultado).toBe(0);
    });

    test('debería retornar 0 cuando no hay suficientes registros históricos', async () => {
      HistorialPrecios.findAll.mockResolvedValue([{ precio: 100 }]);
      
      const resultado = await historialService.calcularVariacionPorcentual(1, 110);
      expect(resultado).toBe(0);
    });

    test('debería calcular correctamente la variación porcentual positiva', async () => {
      HistorialPrecios.findAll.mockResolvedValue([
        { precio: 100 },
        { precio: 90 } // Precio anterior diferente
      ]);
      
      const resultado = await historialService.calcularVariacionPorcentual(1, 100);
      // (100 - 90) / 90 * 100 = 11.11%
      expect(resultado).toBeCloseTo(11.11, 2);
    });

    test('debería calcular correctamente la variación porcentual negativa', async () => {
      HistorialPrecios.findAll.mockResolvedValue([
        { precio: 80 },
        { precio: 100 } // Precio anterior más alto
      ]);
      
      const resultado = await historialService.calcularVariacionPorcentual(1, 80);
      // (80 - 100) / 100 * 100 = -20%
      expect(resultado).toBe(-20);
    });
  });

  describe('obtenerUltimoPrecio', () => {
    test('debería retornar precio del historial cuando existe', async () => {
      HistorialPrecios.findOne.mockResolvedValue({ precio: 150.50 });
      
      const resultado = await historialService.obtenerUltimoPrecio(1);
      expect(resultado).toBe(150.50);
    });

    test('debería retornar precio del activo cuando no hay historial', async () => {
      HistorialPrecios.findOne.mockResolvedValue(null);
      Activo.findByPk.mockResolvedValue({ ultimo_precio: 200.75 });
      
      const resultado = await historialService.obtenerUltimoPrecio(1);
      expect(resultado).toBe(200.75);
    });

    test('debería retornar null cuando no encuentra precio', async () => {
      HistorialPrecios.findOne.mockResolvedValue(null);
      Activo.findByPk.mockResolvedValue(null);
      
      const resultado = await historialService.obtenerUltimoPrecio(1);
      expect(resultado).toBeNull();
    });
  });
});
