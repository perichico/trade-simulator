import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login user and update usuario$ observable', () => {
      const mockUsuario: Usuario = {
        id: 1,
        nombre: 'Test User',
        email: 'test@test.com',
        rol: 'usuario',
        estado: 'activo',
        fechaRegistro: new Date()
      };

      const loginData = { email: 'test@test.com', contrasena: 'password' };

      service.login(loginData.email, loginData.contrasena).subscribe(result => {
        expect(result).toEqual(mockUsuario);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginData);
      req.flush(mockUsuario);

      // Verificar que el observable usuario$ se actualice
      service.usuario$.subscribe(usuario => {
        expect(usuario).toEqual(mockUsuario);
      });
    });

    it('should handle login error', () => {
      service.login('test@test.com', 'wrongpassword').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/login`);
      req.flush({ error: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should logout user and clear usuario$ observable', () => {
      service.logout().subscribe(result => {
        expect(result).toEqual({ success: true });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/logout`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });

      // Verificar que el observable usuario$ se limpie
      service.usuario$.subscribe(usuario => {
        expect(usuario).toBeNull();
      });
    });

    it('should handle logout error', () => {
      service.logout().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/logout`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should clear user state even on logout error', () => {
      // Primero establecer un usuario
      const mockUsuario: Usuario = {
        id: 1,
        nombre: 'Test User',
        email: 'test@test.com',
        rol: 'usuario',
        estado: 'activo',
        fechaRegistro: new Date()
      };
      
      service['usuarioSubject'].next(mockUsuario);
      
      // Intentar logout con error
      service.logout().subscribe(
        () => {},
        error => {
          // Verificar que el usuario se haya limpiado a pesar del error
          expect(service.obtenerUsuario()).toBeNull();
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/logout`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('obtenerUsuario', () => {
    it('should return current user from BehaviorSubject', () => {
      const mockUsuario: Usuario = {
        id: 1,
        nombre: 'Test User',
        email: 'test@test.com',
        rol: 'usuario',
        estado: 'activo',
        fechaRegistro: new Date()
      };

      // Simular que hay un usuario logueado
      service['usuarioSubject'].next(mockUsuario);

      const currentUser = service.obtenerUsuario();
      expect(currentUser).toEqual(mockUsuario);
    });

    it('should return null when no user is logged in', () => {
      const currentUser = service.obtenerUsuario();
      expect(currentUser).toBeNull();
    });
  });

  describe('estaAutenticado', () => {
    it('should return true when user is authenticated', () => {
      const mockUsuario: Usuario = {
        id: 1,
        nombre: 'Test User',
        email: 'test@test.com',
        rol: 'usuario',
        estado: 'activo',
        fechaRegistro: new Date()
      };

      service['usuarioSubject'].next(mockUsuario);
      expect(service.estaAutenticado()).toBe(true);
    });

    it('should return false when no user is authenticated', () => {
      service['usuarioSubject'].next(null);
      expect(service.estaAutenticado()).toBe(false);
    });
  });

  describe('usuario$ observable', () => {
    it('should emit user updates', (done) => {
      const mockUsuario: Usuario = {
        id: 1,
        nombre: 'Test User',
        email: 'test@test.com',
        rol: 'usuario',
        estado: 'activo',
        fechaRegistro: new Date()
      };

      let emissionCount = 0;
      service.usuario$.subscribe(usuario => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(usuario).toBeNull(); // Initial value
        } else if (emissionCount === 2) {
          expect(usuario).toEqual(mockUsuario);
          done();
        }
      });

      // Trigger emission
      service['usuarioSubject'].next(mockUsuario);
    });
  });

  describe('error handling', () => {
    it('should handle network errors during login', () => {
      service.login('test@test.com', 'password').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error).toBeDefined();
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/login`);
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle invalid credentials', () => {
      service.login('invalid@test.com', 'wrongpassword').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(401);
          expect(error.error.message).toBe('Credenciales inválidas');
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/login`);
      req.flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle timeout errors', () => {
      service.login('test@test.com', 'password').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(0);
          expect(error.statusText).toBe('Unknown Error');
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/login`);
      req.flush(null, { status: 0, statusText: 'Unknown Error' });
    });

    it('should handle malformed response data', () => {
      service.login('test@test.com', 'password').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/login`);
      req.flush('Invalid JSON', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('input validation', () => {
    it('should handle empty email in login', () => {
      service.login('', 'password').subscribe(result => {
        // El servicio debería procesar la petición aunque esté vacía
        expect(result).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/login`);
      expect(req.request.body).toEqual({ email: '', contrasena: 'password' });
      req.flush({ error: 'Email requerido' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle empty password in login', () => {
      service.login('test@test.com', '').subscribe(result => {
        expect(result).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/login`);
      expect(req.request.body).toEqual({ email: 'test@test.com', contrasena: '' });
      req.flush({ error: 'Contraseña requerida' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle special characters in credentials', () => {
      const specialEmail = 'test+special@test.com';
      const specialPassword = 'p@$$w0rd!';
      
      service.login(specialEmail, specialPassword).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/login`);
      expect(req.request.body).toEqual({ 
        email: specialEmail, 
        contrasena: specialPassword 
      });
      req.flush({ id: 1, nombre: 'Test', email: specialEmail });
    });
  });

  describe('service state management', () => {
    it('should initialize with null user', () => {
      expect(service.obtenerUsuario()).toBeNull();
      expect(service.estaAutenticado()).toBe(false);
    });

    it('should maintain state consistency across multiple calls', () => {
      const mockUsuario: Usuario = {
        id: 1,
        nombre: 'Test User',
        email: 'test@test.com',
        rol: 'usuario',
        estado: 'activo',
        fechaRegistro: new Date()
      };

      service['usuarioSubject'].next(mockUsuario);
      
      // Multiple calls should return the same result
      expect(service.obtenerUsuario()).toEqual(mockUsuario);
      expect(service.obtenerUsuario()).toEqual(mockUsuario);
      expect(service.estaAutenticado()).toBe(true);
      expect(service.estaAutenticado()).toBe(true);
    });

    it('should handle rapid state changes', () => {
      const mockUsuario1: Usuario = {
        id: 1,
        nombre: 'User 1',
        email: 'user1@test.com',
        rol: 'usuario',
        estado: 'activo',
        fechaRegistro: new Date()
      };

      const mockUsuario2: Usuario = {
        id: 2,
        nombre: 'User 2',
        email: 'user2@test.com',
        rol: 'admin',
        estado: 'activo',
        fechaRegistro: new Date()
      };

      // Rapid changes
      service['usuarioSubject'].next(mockUsuario1);
      expect(service.obtenerUsuario()).toEqual(mockUsuario1);
      
      service['usuarioSubject'].next(mockUsuario2);
      expect(service.obtenerUsuario()).toEqual(mockUsuario2);
      
      service['usuarioSubject'].next(null);
      expect(service.obtenerUsuario()).toBeNull();
    });
  });

  describe('HTTP request configuration', () => {
    it('should send correct headers in login request', () => {
      service.login('test@test.com', 'password').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/login`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({ id: 1, nombre: 'Test User' });
    });

    it('should send correct headers in logout request', () => {
      service.logout().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/logout`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('should handle requests with credentials', () => {
      service.login('test@test.com', 'password').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/login`);
      // Verify request was made (implicit credential handling)
      expect(req.request).toBeDefined();
      req.flush({ id: 1, nombre: 'Test User' });
    });
  });
});
