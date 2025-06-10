// Mock de las dependencias
jest.mock('../../services/historialPreciosService');
jest.mock('../../database/db');
jest.mock('../../models', () => ({}));

const PreciosService = require('../../services/preciosService');
const HistorialPreciosService = require('../../services/historialPreciosService');

describe('PreciosService', () => {
  let preciosService;
  let historialServiceMock;

  beforeEach(() => {
    // Configurar mocks
    historialServiceMock = {
      obtenerUltimoPrecio: jest.fn().mockResolvedValue(100),
      registrarPrecio: jest.fn().mockResolvedValue(true),
      calcularVariacionPorcentual: jest.fn().mockResolvedValue(0)
    };

    HistorialPreciosService.mockImplementation(() => historialServiceMock);

    preciosService = new PreciosService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generarPrecioBaseAleatorio', () => {
    test('debería generar un precio entre 10 y 1000', () => {
      const precio = preciosService.generarPrecioBaseAleatorio();
      
      expect(precio).toBeGreaterThanOrEqual(10);
      expect(precio).toBeLessThanOrEqual(1000);
      expect(typeof precio).toBe('number');
    });

    test('debería generar precios diferentes en múltiples llamadas', () => {
      const precios = [];
      for (let i = 0; i < 5; i++) {
        precios.push(preciosService.generarPrecioBaseAleatorio());
      }
      
      // Al menos uno debería ser diferente (muy alta probabilidad)
      const todosIguales = precios.every(precio => precio === precios[0]);
      expect(todosIguales).toBe(false);
    });
  });

  describe('actualizarPreciosActivos', () => {
    test('debería retornar array vacío cuando no hay activos', async () => {
      const resultado = await preciosService.actualizarPreciosActivos([]);
      
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBe(0);
    });

    test('debería procesar activos y retornar actualizaciones', async () => {
      const activosMock = [
        { id: 1, simbolo: 'AAPL' },
        { id: 2, simbolo: 'GOOGL' }
      ];

      const resultado = await preciosService.actualizarPreciosActivos(activosMock);
      
      expect(Array.isArray(resultado)).toBe(true);
      
      resultado.forEach(actualizacion => {
        expect(actualizacion).toHaveProperty('id');
        expect(actualizacion).toHaveProperty('ultimo_precio');
        expect(actualizacion).toHaveProperty('ultima_actualizacion');
        expect(typeof actualizacion.ultimo_precio).toBe('number');
        expect(actualizacion.ultima_actualizacion).toBeInstanceOf(Date);
      });

      // Verificar que se llamó el mock del historial
      expect(historialServiceMock.registrarPrecio).toHaveBeenCalled();
    });
  });
});
