import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Transaccion } from '../models/transaccion.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransaccionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todas las transacciones del usuario actual
  obtenerTransaccionesPorUsuario(usuarioId: number): Observable<Transaccion[]> {
    return this.http.get<Transaccion[]>(`${this.apiUrl}/transacciones/usuario`, { withCredentials: true })
      .pipe(
        map(transacciones => {
          // Añadir propiedades calculadas
          return transacciones.map(transaccion => ({
            ...transaccion,
            valorTotal: transaccion.precio * Math.abs(transaccion.cantidad),
            fecha: new Date(transaccion.fecha) // Asegurar que la fecha es un objeto Date
          }));
        }),
        catchError(error => {
          console.error('Error al obtener transacciones', error);
          if (error.status === 404) {
            // Si no se encuentran transacciones, devolver array vacío en lugar de error
            return of([]);
          }
          return throwError(() => error);
        })
      );
  }

  // Crear una nueva transacción (compra o venta)
  crearTransaccion(activoId: number, tipo: 'compra' | 'venta', cantidad: number, portafolioSeleccionado?: number): Observable<Transaccion> {
    console.log('=== CREANDO TRANSACCIÓN EN SERVICIO ===');
    console.log('Datos:', { activoId, tipo, cantidad, portafolioSeleccionado });
    
    const body = {
      activoId,
      tipo,
      cantidad,
      portafolioSeleccionado
    };
    
    console.log('Body de la petición:', body);
    
    return this.http.post<Transaccion>(`${this.apiUrl}/transacciones/creartransaccion`, body, { 
      withCredentials: true 
    }).pipe(
      catchError(error => {
        console.error('=== ERROR EN TRANSACCIÓN ===');
        console.error('Error completo:', error);
        console.error('Status:', error.status);
        console.error('Error body:', error.error);
        console.error('==========================');
        
        let mensajeError = 'Error desconocido';
        
        if (error.status === 0) {
          mensajeError = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        } else if (error.status === 401) {
          mensajeError = 'No estás autenticado. Por favor, inicia sesión.';
        } else if (error.status === 400) {
          mensajeError = error.error?.error || 'Datos de transacción inválidos';
        } else if (error.status === 404) {
          mensajeError = 'Activo no encontrado';
        } else if (error.status === 500) {
          mensajeError = error.error?.error || 'Error en el servidor';
        }
        
        return throwError(() => ({ error: { error: mensajeError } }));
      })
    );
  }

  // Método para calcular el rendimiento de una transacción
  calcularRendimiento(transaccion: Transaccion, precioActual: number): number {
    if (transaccion.tipo === 'compra') {
      return (precioActual - transaccion.precio) * transaccion.cantidad;
    } else {
      return (transaccion.precio - precioActual) * transaccion.cantidad;
    }
  }

  // Método para calcular el rendimiento porcentual
  calcularRendimientoPorcentual(transaccion: Transaccion, precioActual: number): number {
    if (transaccion.precio === 0) return 0;
    
    if (transaccion.tipo === 'compra') {
      return ((precioActual - transaccion.precio) / transaccion.precio) * 100;
    } else {
      return ((transaccion.precio - precioActual) / transaccion.precio) * 100;
    }
  }

  obtenerTransaccionesPorActivo(activoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transacciones/activo/${activoId}`, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error al obtener transacciones por activo', error);
        if (error.status === 404) {
          // Si no se encuentran transacciones para este activo, devolver array vacío
          return of([]);
        }
        return throwError(() => error);
      })
    );
  }

  // También agregar método para obtener todas las transacciones del usuario si no existe
  obtenerTransaccionesUsuario(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transacciones/usuario`, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error al obtener transacciones del usuario', error);
        if (error.status === 404) {
          // Si no se encuentran transacciones, devolver array vacío
          return of([]);
        }
        return throwError(() => error);
      })
    );
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}