import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry, timeout, delay } from 'rxjs/operators';
import { Alerta } from '../models/alerta.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlertaService {
  // Verificar que la URL base sea correcta
  private apiUrl = `${environment.apiUrl}/api/alertas`;

  constructor(private http: HttpClient) {
    console.log('URL base de la API:', environment.apiUrl);
    console.log('URL completa para alertas:', this.apiUrl);
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error HTTP detallado:', error);
    
    if (error.status === 0) {
      // Error de conexión - Sin acceso al servidor
      console.error('Error de conexión con el servidor:', error.error);
    } else {
      // Error devuelto por el backend
      console.error(`Backend devolvió código ${error.status}, respuesta:`, error.error);
    }
    
    // Devolver un mensaje amigable
    return throwError(() => error);
  }

  obtenerAlertasUsuario(): Observable<Alerta[]> {
    console.log('Solicitando alertas al servidor:', this.apiUrl);
    
    return this.http.get<Alerta[]>(this.apiUrl)
      .pipe(
        timeout(10000),
        retry(1),
        catchError(this.handleError)
      );
  }

  crearAlerta(alerta: Alerta): Observable<Alerta> {
    console.log('Enviando nueva alerta al servidor:', alerta);
    
    return this.http.post<Alerta>(this.apiUrl, alerta)
      .pipe(
        catchError(this.handleError)
      );
  }

  activarAlerta(id: number): Observable<any> {
    console.log(`Activando alerta ${id}`);
    
    return this.http.patch(`${this.apiUrl}/${id}/activar`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  desactivarAlerta(id: number): Observable<any> {
    console.log(`Desactivando alerta ${id}`);
    
    return this.http.patch(`${this.apiUrl}/${id}/desactivar`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  eliminarAlerta(id: number): Observable<any> {
    console.log(`Eliminando alerta ${id}`);
    
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  // Datos de prueba para desarrollo
  private getMockAlertas(): Alerta[] {
    return [
      {
        id: 1,
        usuarioId: 1,
        activoId: 1, // Apple
        precioObjetivo: 850,
        cantidadVenta: 10,
        activa: true
      },
      {
        id: 2,
        usuarioId: 1,
        activoId: 2, // Microsoft
        precioObjetivo: 300,
        cantidadVenta: 5,
        activa: false
      },
      {
        id: 3,
        usuarioId: 1,
        activoId: 5, // Google
        precioObjetivo: 250,
        cantidadVenta: 3,
        activa: true
      }
    ];
  }
}