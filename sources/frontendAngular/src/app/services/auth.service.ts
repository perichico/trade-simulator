import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl; // URL del backend
  private usuarioActual = new BehaviorSubject<Usuario | null>(null);
  
  constructor(private http: HttpClient) {
    // Intentar recuperar usuario de sesión al iniciar
    this.verificarSesion();
  }

  // Observable para componentes que necesitan el estado de autenticación
  get usuario$(): Observable<Usuario | null> {
    return this.usuarioActual.asObservable();
  }

  // Verificar si hay una sesión activa
  verificarSesion(): Observable<boolean> {
    // Verificar con el backend si hay una sesión activa
    return this.http.get<any>(`${this.apiUrl}/verificar-sesion`, { withCredentials: true })
      .pipe(
        tap(respuesta => {
          if (respuesta && respuesta.autenticado && respuesta.usuario) {
            this.guardarSesion(respuesta.usuario);
          } else {
            this.limpiarSesion();
          }
        }),
        switchMap(respuesta => of(respuesta && respuesta.autenticado)),
        catchError(error => {
          console.error('Error al verificar sesión:', error);
          // Si hay error, intentamos recuperar del localStorage como fallback
          const usuarioGuardado = localStorage.getItem('usuario');
          if (usuarioGuardado) {
            this.usuarioActual.next(JSON.parse(usuarioGuardado));
            return of(true);
          }
          this.limpiarSesion();
          return of(false);
        })
      );
  }


  // Iniciar sesión
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap(respuesta => {
          if (respuesta && respuesta.usuario) {
            this.guardarSesion(respuesta.usuario);
          }
        }),
        catchError(error => {
          console.error('Error en login:', error);
          this.limpiarSesion();
          return throwError(() => error);
        })
      );
  }

  // Registrar nuevo usuario
  registro(nombre: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/registro`, { nombre, email, password }, { withCredentials: true })
      .pipe(
        tap(respuesta => {
          if (respuesta && respuesta.usuario) {
            this.guardarSesion(respuesta.usuario);
          }
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  // Cerrar sesión
  logout(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/logout`, { withCredentials: true })
      .pipe(
        tap(() => {
          this.limpiarSesion();
        }),
        catchError(error => {
          // Incluso si hay error, limpiamos la sesión local
          this.limpiarSesion();
          return throwError(() => error);
        })
      );
  }

  // Guardar información de sesión
  private guardarSesion(usuario: Usuario): void {
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.usuarioActual.next(usuario);
  }

  // Limpiar información de sesión
  private limpiarSesion(): void {
    localStorage.removeItem('usuario');
    this.usuarioActual.next(null);
  }

  // Verificar si el usuario está autenticado
  estaAutenticado(): boolean {
    return this.usuarioActual.value !== null;
  }
}