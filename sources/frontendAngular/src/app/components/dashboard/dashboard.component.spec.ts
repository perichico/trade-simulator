import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, BehaviorSubject } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';
import { PortafolioService } from '../../services/portafolio.service';
import { TransaccionService } from '../../services/transaccion.service';
import { PatrimonioService } from '../../services/patrimonio.service';
import { Usuario } from '../../models/usuario.model';
import { Portafolio } from '../../models/portafolio.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockPortafolioService: jasmine.SpyObj<PortafolioService>;
  let mockTransaccionService: jasmine.SpyObj<TransaccionService>;
  let mockPatrimonioService: jasmine.SpyObj<PatrimonioService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockUsuario: Usuario = {
    id: 1,
    nombre: 'Test User',
    email: 'test@test.com',
    rol: 'usuario',
    estado: 'activo',
    fechaRegistro: new Date()
  };

  const mockPortafolio: Portafolio = {
    id: 1,
    nombre: 'Portafolio Principal',
    usuarioId: 1,
    activos: [],
    valorTotal: 0,
    rendimientoTotal: 0,
    fechaCreacion: new Date(),
    saldo: 10000
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      usuario$: new BehaviorSubject<Usuario | null>(mockUsuario)
    });
    const portafolioServiceSpy = jasmine.createSpyObj('PortafolioService', [
      'obtenerPortafolios', 'crearPortafolio', 'seleccionarPortafolio', 'obtenerPortafolioPorId'
    ]);
    const transaccionServiceSpy = jasmine.createSpyObj('TransaccionService', ['crearTransaccion']);
    const patrimonioServiceSpy = jasmine.createSpyObj('PatrimonioService', ['obtenerHistorialPatrimonio']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: PortafolioService, useValue: portafolioServiceSpy },
        { provide: TransaccionService, useValue: transaccionServiceSpy },
        { provide: PatrimonioService, useValue: patrimonioServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockPortafolioService = TestBed.inject(PortafolioService) as jasmine.SpyObj<PortafolioService>;
    mockTransaccionService = TestBed.inject(TransaccionService) as jasmine.SpyObj<TransaccionService>;
    mockPatrimonioService = TestBed.inject(PatrimonioService) as jasmine.SpyObj<PatrimonioService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('formatearDinero', () => {
    it('should format money correctly', () => {
      expect(component.formatearDinero(1000)).toBe('1.000,00 €');
      expect(component.formatearDinero(1234.56)).toBe('1.234,56 €');
      expect(component.formatearDinero(0)).toBe('0,00 €');
    });

    it('should handle null and undefined values', () => {
      expect(component.formatearDinero(null as any)).toBe('0,00 €');
      expect(component.formatearDinero(undefined as any)).toBe('0,00 €');
    });
  });

  describe('obtenerClaseValor', () => {
    it('should return positive-value class for positive numbers', () => {
      expect(component.obtenerClaseValor(100)).toBe('positive-value');
      expect(component.obtenerClaseValor(0.01)).toBe('positive-value');
    });

    it('should return positive-value class for zero', () => {
      expect(component.obtenerClaseValor(0)).toBe('positive-value');
    });

    it('should return negative-value class for negative numbers', () => {
      expect(component.obtenerClaseValor(-100)).toBe('negative-value');
      expect(component.obtenerClaseValor(-0.01)).toBe('negative-value');
    });
  });

  describe('obtenerValorTotalPortafolio', () => {
    it('should return 0 when no portfolio is selected', () => {
      component.portafolioSeleccionado = null;
      expect(component.obtenerValorTotalPortafolio()).toBe(0);
    });

    it('should return 0 when portfolio has no assets', () => {
      component.portafolioSeleccionado = { ...mockPortafolio, activos: [] };
      expect(component.obtenerValorTotalPortafolio()).toBe(0);
    });

    it('should calculate total value correctly', () => {
      const mockPortafolioConActivos = {
        ...mockPortafolio,
        activos: [
          {
            activoId: 1,
            nombre: 'Apple',
            simbolo: 'AAPL',
            cantidad: 10,
            precioCompra: 100,
            precioActual: 120,
            valorTotal: 1200,
            rendimiento: 200,
            rendimientoPorcentaje: 20
          },
          {
            activoId: 2,
            nombre: 'Google',
            simbolo: 'GOOGL',
            cantidad: 5,
            precioCompra: 200,
            precioActual: 250,
            valorTotal: 1250,
            rendimiento: 250,
            rendimientoPorcentaje: 25
          }
        ]
      };
      
      component.portafolioSeleccionado = mockPortafolioConActivos;
      
      // 10 * 120 + 5 * 250 = 1200 + 1250 = 2450
      expect(component.obtenerValorTotalPortafolio()).toBe(2450);
    });
  });

  describe('cerrarSesion', () => {
    it('should call logout service and navigate to login', () => {
      mockAuthService.logout.and.returnValue(of({}));
      
      component.cerrarSesion();
      
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('calcularRendimientoPorcentual', () => {
    it('should return 0 when no portfolio is selected', () => {
      component.portafolioSeleccionado = null;
      expect(component.calcularRendimientoPorcentual()).toBe(0);
    });

    it('should calculate percentage return correctly', () => {
      const mockPortafolioConRendimiento = {
        ...mockPortafolio,
        saldo: 8000, // Saldo actual
        activos: [
          {
            activoId: 1,
            nombre: 'Apple',
            simbolo: 'AAPL',
            cantidad: 10,
            precioCompra: 100,
            precioActual: 120,
            valorTotal: 1200,
            rendimiento: 200,
            rendimientoPorcentaje: 20
          }
        ]
      };
      
      component.portafolioSeleccionado = mockPortafolioConRendimiento;
      
      // Patrimonio total: 8000 (saldo) + 1200 (valor activos) = 9200
      // Rendimiento: 9200 - 10000 (saldo inicial) = -800
      // Porcentaje: (-800 / 10000) * 100 = -8%
      expect(component.calcularRendimientoPorcentual()).toBe(-8);
    });
  });
});
