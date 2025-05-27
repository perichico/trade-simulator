import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl; // URL del backend
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  private esAdministradorSubject = new BehaviorSubject<boolean>(false);

  // Observable para componentes que necesitan el estado de autenticación
  usuario$ = this.usuarioSubject.asObservable();
  // Observable para verificar si es administrador
  esAdministrador$ = this.esAdministradorSubject.asObservable();

  constructor(private http: HttpClient) {
    // Intentar recuperar usuario de sesión al iniciar
    this.verificarSesion();
  }

  // Verificar si hay una sesión activa
  verificarSesion(): Observable<boolean> {
    // Verificar con el backend si hay una sesión activa
    return this.http.get<any>(`${this.apiUrl}/verificar-sesion`, { withCredentials: true })
      .pipe(
        map(response => {
          if (response.autenticado && response.usuario) {
            this.usuarioSubject.next(response.usuario);
            this.esAdministradorSubject.next(response.usuario.rol === 'admin');
            return true;
          } else {
            this.usuarioSubject.next(null);
            this.esAdministradorSubject.next(false);
            return false;
          }
        }),
        catchError(() => {
          this.usuarioSubject.next(null);
          this.esAdministradorSubject.next(false);
          return of(false);
        })
      );
  }

  // Iniciar sesión
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response.usuario) {
            this.usuarioSubject.next(response.usuario);
            this.esAdministradorSubject.next(response.usuario.rol === 'admin');
          }
        })
      );
  }

  // Registrar nuevo usuario
  registro(nombre: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/registro`, { nombre, email, password }, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response.usuario) {
            this.usuarioSubject.next(response.usuario);
            this.esAdministradorSubject.next(response.usuario.rol === 'admin');
          }
        })
      );
  }

  // Cerrar sesión
  logout(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/logout`, { withCredentials: true })
      .pipe(
        tap(() => {
          this.usuarioSubject.next(null);
          this.esAdministradorSubject.next(false);
        })
      );
  }

  // Verificar si el usuario está autenticado
  estaAutenticado(): boolean {
    return this.usuarioSubject.value !== null;
  }

  // Verificar si el usuario es administrador
  esAdministrador(): boolean {
    const usuario = this.usuarioSubject.value;
    return usuario?.rol === 'admin';
  }

  // Obtener información del usuario
  obtenerUsuario(): Usuario | null {
    return this.usuarioSubject.value;
  }
}