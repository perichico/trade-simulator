import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError, of } from 'rxjs';
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
    console.log('AdminService: URL completa:', `${this.apiUrl}/activos`);
    
    return this.http.get<any>(`${this.apiUrl}/activos`, { withCredentials: true }).pipe(
      tap(response => {
        console.log('AdminService: Respuesta cruda del servidor:', response);
        console.log('AdminService: Tipo de respuesta:', typeof response);
        console.log('AdminService: Es array?:', Array.isArray(response));
        if (Array.isArray(response)) {
          console.log('AdminService: Cantidad de elementos en array:', response.length);
          response.forEach((item, index) => {
            console.log(`AdminService: Elemento ${index}:`, item);
          });
        }
      }),
      catchError(error => {
        console.error('AdminService: Error detallado al obtener activos:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message,
          url: error.url
        });
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

  obtenerTiposActivos(): Observable<any[]> {
    console.log('AdminService: Obteniendo tipos de activos...');
    return this.http.get<any[]>(`${this.apiUrl}/tipos-activos`, { withCredentials: true })
      .pipe(
        tap(response => console.log('AdminService: Tipos de activos recibidos:', response)),
        catchError(error => {
          console.error('AdminService: Error al obtener tipos de activos:', error);
          // Devolver tipos por defecto en caso de error
          const tiposPorDefecto = [
          { id: 1, nombre: 'Acción' },
          { id: 2, nombre: 'ETF' },
          { id: 3, nombre: 'Bonos' },
          { id: 4, nombre: 'Materias Primas' },
          { id: 5, nombre: 'Criptomonedas' },
          { id: 6, nombre: 'Forex' }
          ];
          console.log('AdminService: Devolviendo tipos por defecto');
          return of(tiposPorDefecto);
        })
      );
  }

  // Métodos para gestión de dividendos
  procesarDividendosAutomaticos(): Observable<any> {
    console.log('AdminService: Procesando dividendos automáticos...');
    // Usar la ruta correcta que existe en el backend
    return this.http.post(`${environment.apiUrl}/api/dividendos/procesar-automaticos`, {}, { withCredentials: true })
      .pipe(
        tap(data => {
          console.log('AdminService: Dividendos procesados exitosamente:', data);
          if (data && typeof data === 'object' && 'total' in data && data.total === 0) {
            console.log('AdminService: No se procesaron dividendos - revisar configuración de activos');
          }
        }),
        catchError(error => {
          console.error('AdminService: Error al procesar dividendos automáticos:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            message: error.message
          });
          throw error;
        })
      );
  }

  obtenerDividendosAdmin(): Observable<any[]> {
    console.log('AdminService: Obteniendo dividendos para admin...');
    // Usar la ruta principal de dividendos en lugar de la ruta de admin
    const url = `${environment.apiUrl}/api/dividendos`;
    console.log('AdminService: URL completa:', url);
    
    return this.http.get<any>(url, { withCredentials: true })
      .pipe(
        tap(response => {
          console.log('AdminService: Respuesta cruda recibida:', response);
          console.log('AdminService: Tipo de respuesta:', typeof response);
        }),
        map(response => {
          console.log('AdminService: Procesando respuesta...');
          
          // Manejar la nueva estructura con success y data
          if (response && response.success && response.data) {
            console.log('AdminService: Usando response.data, elementos:', response.data.length);
            return response.data;
          }
          
          // Si es array directo (compatibilidad)
          if (Array.isArray(response)) {
            console.log('AdminService: Usando array directo, elementos:', response.length);
            return response;
          }
          
          console.log('AdminService: Respuesta no reconocida, devolviendo array vacío');
          return [];
        }),
        tap(data => {
          console.log('AdminService: Dividendos procesados:', data.length);
          if (data.length > 0) {
            console.log('AdminService: Primer dividendo:', data[0]);
          }
        }),
        catchError(error => {
          console.error('AdminService: Error detallado al obtener dividendos:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            message: error.message,
            url: error.url
          });
          return of([]);
        })
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('AdminService: Ocurrió un error', error);
    return throwError(() => error);
  }
}
