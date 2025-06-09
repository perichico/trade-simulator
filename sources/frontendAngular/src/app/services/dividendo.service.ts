import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Dividendo {
  id?: number;
  activo_id: number;
  fecha: Date | string;
  monto_por_accion: number;
  estado: 'pendiente' | 'pagado' | 'cancelado';
  activo?: any;
  cantidadAcciones?: number;
  montoTotal?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DividendoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  obtenerDividendos(): Observable<Dividendo[]> {
    console.log('🔄 DividendoService: Obteniendo dividendos generales...');
    console.log('🌐 URL:', `${this.apiUrl}/api/dividendos`);
    
    return this.http.get<any>(`${this.apiUrl}/api/dividendos`, { withCredentials: true })
      .pipe(
        tap(response => {
          console.log('✅ Dividendos obtenidos:', response);
          if (response && response.success) {
            console.log(`📊 Total de dividendos: ${response.total}`);
          }
        }),
        map(response => {
          // Manejar la nueva estructura de respuesta
          if (response && response.success && response.data) {
            return response.data;
          }
          // Si es array directo (compatibilidad)
          if (Array.isArray(response)) {
            return response;
          }
          return [];
        }),
        catchError(error => {
          console.error('❌ Error al obtener dividendos:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          return of([]);
        })
      );
  }

  obtenerDividendosPorUsuario(): Observable<Dividendo[]> {
    console.log('🔄 Iniciando solicitud de dividendos del usuario...');
    console.log('🌐 URL de la API:', `${this.apiUrl}/api/dividendos/usuario`);
    
    return this.http.get<any>(`${this.apiUrl}/api/dividendos/usuario`, { 
      withCredentials: true,
      observe: 'response'
    })
      .pipe(
        tap(response => {
          console.log('✅ Respuesta HTTP completa recibida:', {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers.keys(),
            body: response.body
          });
          
          // Si la respuesta tiene la estructura nueva con 'data'
          if (response.body && response.body.success && response.body.data) {
            console.log(`📊 Dividendos procesados exitosamente: ${response.body.total} registros`);
            console.log(`👤 Usuario: ${response.body.usuario?.nombre || 'Desconocido'}`);
          }
        }),
        // Transformar la respuesta para extraer solo los datos
        map(response => {
          const body = response.body;
          if (body && body.success && body.data) {
            return body.data;
          }
          // Si es la respuesta anterior (array directo)
          if (Array.isArray(body)) {
            return body;
          }
          return [];
        }),
        catchError(error => {
          console.error('❌ Error detallado al obtener dividendos del usuario:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error,
            url: error.url,
            timestamp: new Date().toISOString(),
            headers: error.headers ? 'Present' : 'Missing'
          });
          
          // Log adicional del error del servidor si está disponible
          if (error.error) {
            console.error('📋 Detalles del error del servidor:', error.error);
          }
          
          // Manejo específico por tipo de error
          if (error.status === 401) {
            console.warn('🔐 Error de autenticación - usuario no logueado');
          } else if (error.status === 403) {
            console.warn('🚫 Error de permisos - usuario suspendido o sin acceso');
          } else if (error.status === 400) {
            console.error('📝 Error de solicitud - datos inválidos o sesión problemática');
          } else if (error.status === 500) {
            console.error('💥 Error interno del servidor');
          }
          
          // Siempre retornar array vacío para mantener la funcionalidad
          return of([]);
        })
      );
  }

  // Método alternativo para obtener dividendos sin observe: 'response'
  obtenerDividendosSimple(): Observable<Dividendo[]> {
    console.log('🔄 Método simple - Iniciando solicitud de dividendos...');
    
    return this.http.get<any>(`${this.apiUrl}/api/dividendos/usuario`, { withCredentials: true })
      .pipe(
        tap(response => {
          console.log('✅ Respuesta simple recibida:', response);
        }),
        map(response => {
          if (response && response.success && response.data) {
            return response.data;
          }
          if (Array.isArray(response)) {
            return response;
          }
          return [];
        }),
        catchError(error => {
          console.error('❌ Error en método simple:', error);
          return of([]);
        })
      );
  }

  // Marcar dividendo como pagado
  marcarComoPagado(dividendoId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/dividendos/${dividendoId}/marcar-pagado`, {}, { withCredentials: true })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Cancelar dividendo
  cancelarDividendo(dividendoId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/dividendos/${dividendoId}/cancelar`, {}, { withCredentials: true })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener detalles completos de un dividendo
  obtenerDetallesDividendo(dividendoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/dividendos/${dividendoId}/detalles`, { withCredentials: true })
      .pipe(
        catchError(this.handleError)
      );
  }

  crearDividendo(dividendo: Dividendo): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/dividendos/crear`, dividendo, { withCredentials: true })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Método para formatear moneda
  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor || 0);
  }

  // Método para formatear fecha
  formatearFecha(fecha: string | Date): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Método privado para manejar errores
  private handleError(error: any): Observable<any> {
    console.error('Error en DividendoService:', {
      status: error.status,
      message: error.message,
      error: error.error,
      url: error.url
    });
    
    // Retornar un objeto con estructura de error en lugar de null
    return of({
      error: true,
      mensaje: error.error?.error || error.error?.details || error.message || 'Error desconocido',
      status: error.status || 500
    });
  }
}