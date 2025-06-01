import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) { }

  // Obtener todos los usuarios
  obtenerUsuarios(): Observable<Usuario[]> {
    console.log('AdminService: Solicitando usuarios a:', `${this.apiUrl}/usuarios`);
    return this.http.get<any>(`${this.apiUrl}/usuarios`, { 
      withCredentials: true 
    }).pipe(
      map(response => {
        console.log('AdminService: Respuesta recibida:', response);
        // La respuesta puede venir en formato { usuarios: [], total: number }
        if (response && response.usuarios) {
          return response.usuarios;
        }
        // O directamente como array
        return Array.isArray(response) ? response : [];
      }),
      catchError(error => {
        console.error('AdminService: Error al obtener usuarios:', error);
        throw error;
      })
    );
  }

  // Obtener estadísticas del sistema
  obtenerEstadisticas(): Observable<any> {
    console.log('AdminService: Solicitando estadísticas a:', `${this.apiUrl}/estadisticas`);
    console.log('AdminService: URL base configurada:', this.apiUrl);
    console.log('AdminService: URL completa:', `${this.apiUrl}/estadisticas`);
    
    return this.http.get<any>(`${this.apiUrl}/estadisticas`, { 
      withCredentials: true 
    }).pipe(
      map(response => {
        console.log('AdminService: Estadísticas recibidas:', response);
        return response;
      }),
      catchError(error => {
        console.error('AdminService: Error al obtener estadísticas:', error);
        console.error('AdminService: URL que falló:', error.url);
        console.error('AdminService: Status:', error.status);
        throw error;
      })
    );
  }

  // Cambiar rol de usuario
  cambiarRolUsuario(usuarioId: number, nuevoRol: 'usuario' | 'admin'): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${usuarioId}/rol`, 
      { rol: nuevoRol }, 
      { withCredentials: true }
    );
  }

  // Cambiar estado de usuario (activo/suspendido)
  cambiarEstadoUsuario(usuarioId: number, nuevoEstado: 'activo' | 'suspendido'): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${usuarioId}/estado`, 
      { estado: nuevoEstado }, 
      { withCredentials: true }
    );
  }

  // Eliminar usuario
  eliminarUsuario(usuarioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${usuarioId}`, { 
      withCredentials: true 
    });
  }

  // Métodos para gestión de activos
  obtenerActivos(): Observable<any> {
    console.log('AdminService: Obteniendo activos...');
    return this.http.get<any>(`${this.apiUrl}/activos`, { withCredentials: true }).pipe(
      tap(response => console.log('AdminService: Activos obtenidos:', response)),
      catchError(error => {
        console.error('AdminService: Error al obtener activos:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerEstadisticasActivos(): Observable<any> {
    console.log('AdminService: Obteniendo estadísticas de activos...');
    return this.http.get<any>(`${this.apiUrl}/estadisticas-activos`, { withCredentials: true }).pipe(
      tap(response => console.log('AdminService: Estadísticas de activos obtenidas:', response)),
      catchError(error => {
        console.error('AdminService: Error al obtener estadísticas de activos:', error);
        return throwError(() => error);
      })
    );
  }

  crearActivo(activoData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/activos`, activoData, { withCredentials: true });
  }

  actualizarActivo(id: number, activoData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/activos/${id}`, activoData, { withCredentials: true });
  }

  eliminarActivo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/activos/${id}`, { withCredentials: true });
  }
}
