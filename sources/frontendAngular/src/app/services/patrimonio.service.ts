import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PatrimonioHistorico {
  id?: number;
  usuarioId: number;
  portafolioId?: number;
  fecha: Date | string;
  balance: number;
  valorPortafolio: number;
  patrimonioTotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class PatrimonioService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  obtenerHistorialPatrimonio(usuarioId: number, portafolioId?: number): Observable<PatrimonioHistorico[]> {
    // Si se proporciona un ID de portafolio, usamos una URL específica para ese portafolio
    let url = `${this.apiUrl}/api/patrimonio/historial/${usuarioId}`;
    
    if (portafolioId) {
      url = `${this.apiUrl}/api/patrimonio/historial/${usuarioId}/portafolio/${portafolioId}`;
    }
    
    console.log('Realizando petición a:', url);
    
    return this.http.get<PatrimonioHistorico[]>(url).pipe(
      tap(data => console.log('Historial recibido:', data)),
      catchError(this.handleError.bind(this))
    );
  }

  obtenerPatrimonioActual(usuarioId: number): Observable<PatrimonioHistorico> {
    const url = `${this.apiUrl}/api/patrimonio/actual/${usuarioId}`;
    
    return this.http.get<PatrimonioHistorico>(url).pipe(
      tap(data => console.log('Patrimonio actual recibido:', data)),
      catchError(this.handleErrorSingle.bind(this))
    );
  }
  
  // Método para generar historial simulado basado en datos actuales
  generarHistorialSimulado(
    usuarioId: number, 
    portafolioId: number, 
    balanceActual: number, 
    valorPortafolioActual: number
  ): PatrimonioHistorico[] {
    const hoy = new Date();
    const datosMuestra: PatrimonioHistorico[] = [];
    
    // Generar datos de muestra para los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(hoy.getDate() - i);
      
      // Pequeña variación aleatoria (±10%) para simular cambios
      const variacionBalance = Math.random() * 0.2 - 0.1; // -10% a +10%
      const variacionValor = Math.random() * 0.2 - 0.1;   // -10% a +10%
      
      // Calculamos valores basados en los actuales con variación
      // Para el día actual (i=0) usamos exactamente los valores actuales
      const factorTiempo = i === 0 ? 1 : (1 - (i * 0.05)); // Reducción gradual hacia el pasado
      const balance = i === 0 ? balanceActual : Math.round(balanceActual * factorTiempo * (1 + variacionBalance) * 100) / 100;
      const valorPortafolio = i === 0 ? valorPortafolioActual : Math.round(valorPortafolioActual * factorTiempo * (1 + variacionValor) * 100) / 100;
      
      datosMuestra.push({
        usuarioId: usuarioId,
        portafolioId: portafolioId,
        fecha: fecha.toISOString(),
        balance: balance,
        valorPortafolio: valorPortafolio,
        patrimonioTotal: Math.round((balance + valorPortafolio) * 100) / 100
      });
    }
    
    return datosMuestra;
  }
  
  private handleError(error: HttpErrorResponse): Observable<PatrimonioHistorico[]> {
    console.error('Error en la petición HTTP:', error);
    
    if (error.status === 404) {
      console.warn('Endpoint no encontrado, devolviendo array vacío');
      return of([]);
    }
    
    if (error.status === 401) {
      console.warn('Usuario no autenticado');
      return of([]);
    }
    
    if (error.status === 403) {
      console.warn('No autorizado para acceder a estos datos');
      return of([]);
    }
    
    // Para cualquier otro error, devolver array vacío para evitar romper la aplicación
    console.warn('Error del servidor, devolviendo array vacío');
    return of([]);
  }

  private handleErrorSingle(error: HttpErrorResponse): Observable<PatrimonioHistorico> {
    console.error('Error en la petición HTTP:', error);
    
    // Crear un objeto PatrimonioHistorico vacío como fallback
    const emptyPatrimonio: PatrimonioHistorico = {
      usuarioId: 0,
      fecha: new Date(),
      balance: 0,
      valorPortafolio: 0,
      patrimonioTotal: 0
    };
    
    if (error.status === 404) {
      console.warn('Endpoint no encontrado, devolviendo patrimonio vacío');
      return of(emptyPatrimonio);
    }
    
    if (error.status === 401) {
      console.warn('Usuario no autenticado');
      return of(emptyPatrimonio);
    }
    
    if (error.status === 403) {
      console.warn('No autorizado para acceder a estos datos');
      return of(emptyPatrimonio);
    }
    
    // Para cualquier otro error, devolver patrimonio vacío para evitar romper la aplicación
    console.warn('Error del servidor, devolviendo patrimonio vacío');
    return of(emptyPatrimonio);
  }
}