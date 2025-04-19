import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Transaccion } from '../models/transaccion.model';

@Injectable({
  providedIn: 'root'
})
export class TransaccionService {
  private apiUrl = 'http://localhost:3000'; // URL del backend

  constructor(private http: HttpClient) { }

  // Obtener todas las transacciones del usuario actual
  obtenerTransaccionesPorUsuario(usuarioId: number): Observable<Transaccion[]> {
    return this.http.post<Transaccion[]>(`${this.apiUrl}/transacciones/${usuarioId}`, {})
      .pipe(
        map(transacciones => {
          // Añadir propiedades calculadas
          return transacciones.map(transaccion => ({
            ...transaccion,
            valorTotal: transaccion.precio * transaccion.cantidad,
            fecha: new Date(transaccion.fecha) // Asegurar que la fecha es un objeto Date
          }));
        }),
        catchError(error => {
          console.error('Error al obtener transacciones', error);
          return throwError(() => error);
        })
      );
  }

  // Crear una nueva transacción (compra o venta)
  crearTransaccion(activoId: number, tipo: 'compra' | 'venta', cantidad: number): Observable<Transaccion> {
    return this.http.post<Transaccion>(`${this.apiUrl}/creartransaccion`, {
      activoId,
      tipo,
      cantidad
    }).pipe(
      catchError(error => {
        console.error('Error al crear transacción', error);
        let mensajeError = 'Error desconocido';
        
        if (error.status === 401) {
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
}