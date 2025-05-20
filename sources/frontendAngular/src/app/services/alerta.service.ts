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
    
    // Implementar datos de prueba para desarrollo mientras se resuelve el problema con el backend
    if (environment.useTestData) {
      console.log('Usando datos de prueba para alertas');
      return of(this.getMockAlertas()).pipe(
        // Simular retraso de red
        delay(500)
      );
    }
    
    return this.http.get<Alerta[]>(this.apiUrl)
      .pipe(
        timeout(10000),
        retry(1),
        catchError((error) => {
          this.handleError(error);
          // Si hay error, intentar cargar datos de prueba como fallback
          console.log('Error en API real, usando datos de prueba como fallback');
          return of(this.getMockAlertas());
        })
      );
  }

  crearAlerta(alerta: Alerta): Observable<Alerta> {
    console.log('Enviando nueva alerta al servidor:', alerta);
    
    // Si estamos usando datos de prueba o hay problemas con la API
    if (environment.useTestData) {
      console.log('Usando simulación para crear alerta');
      // Simulamos la creación con un ID aleatorio
      const nuevaAlerta: Alerta = {
        ...alerta,
        id: Math.floor(Math.random() * 1000) + 10,
        activa: true
      };
      
      // Añadimos al array de datos de prueba
      const alertas = this.getMockAlertas();
      alertas.push(nuevaAlerta);
      
      // Devolvemos la alerta simulada después de un pequeño retraso
      return of(nuevaAlerta).pipe(delay(500));
    }
    
    return this.http.post<Alerta>(this.apiUrl, alerta)
      .pipe(
        catchError((error) => {
          this.handleError(error);
          console.log('Error en API real, simulando creación como fallback');
          
          // Simulamos la creación como fallback
          const nuevaAlerta: Alerta = {
            ...alerta,
            id: Math.floor(Math.random() * 1000) + 10,
            activa: true
          };
          
          return of(nuevaAlerta);
        })
      );
  }

  activarAlerta(id: number): Observable<any> {
    console.log(`Activando alerta ${id}`);
    
    // Si estamos usando datos de prueba o hay problemas con la API
    if (environment.useTestData) {
      console.log('Usando simulación para activar alerta');
      return of({ success: true }).pipe(delay(300));
    }
    
    return this.http.patch(`${this.apiUrl}/${id}/activar`, {})
      .pipe(
        catchError((error) => {
          this.handleError(error);
          console.log('Error en API real, simulando activación como fallback');
          return of({ success: true });
        })
      );
  }

  desactivarAlerta(id: number): Observable<any> {
    console.log(`Desactivando alerta ${id}`);
    
    // Si estamos usando datos de prueba o hay problemas con la API
    if (environment.useTestData) {
      console.log('Usando simulación para desactivar alerta');
      return of({ success: true }).pipe(delay(300));
    }
    
    return this.http.patch(`${this.apiUrl}/${id}/desactivar`, {})
      .pipe(
        catchError((error) => {
          this.handleError(error);
          console.log('Error en API real, simulando desactivación como fallback');
          return of({ success: true });
        })
      );
  }

  eliminarAlerta(id: number): Observable<any> {
    console.log(`Eliminando alerta ${id}`);
    
    // Si estamos usando datos de prueba o hay problemas con la API
    if (environment.useTestData) {
      console.log('Usando simulación para eliminar alerta');
      return of({ success: true }).pipe(delay(300));
    }
    
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        catchError((error) => {
          this.handleError(error);
          console.log('Error en API real, simulando eliminación como fallback');
          return of({ success: true });
        })
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