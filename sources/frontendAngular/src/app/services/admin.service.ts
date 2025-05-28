import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

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

  // Cambiar estado de usuario (activo/inactivo)
  toggleEstadoUsuario(usuarioId: number, activo: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${usuarioId}/estado`, 
      { activo }, 
      { withCredentials: true }
    );
  }

  // Eliminar usuario
  eliminarUsuario(usuarioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${usuarioId}`, { 
      withCredentials: true 
    });
  }
}
