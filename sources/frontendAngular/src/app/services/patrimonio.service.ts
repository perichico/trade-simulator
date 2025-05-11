import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PatrimonioHistorico {
  id?: number;
  usuarioId: number;
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

  obtenerHistorialPatrimonio(usuarioId: number): Observable<PatrimonioHistorico[]> {
    // Modificamos la URL para que coincida con la estructura correcta del backend
    // Probamos con /api/patrimonio/historial/:id en lugar de /patrimonio/historial/:id
    const url = `${this.apiUrl}/api/patrimonio/historial/${usuarioId}`;
    console.log('Realizando petición a:', url);
    
    return this.http.get<PatrimonioHistorico[]>(url).pipe(
      tap(data => console.log('Historial recibido:', data)),
      catchError(this.handleError)
    );
  }
  
  private handleError(error: HttpErrorResponse) {
    console.error('Error en la petición HTTP:', error);
    
    if (error.status === 404) {
      console.warn('Endpoint no encontrado, devolviendo array vacío');
      // Devolver un array vacío para evitar errores en el componente
      return of([]);
    }
    
    return throwError(() => new Error('Ha ocurrido un error al obtener los datos. Por favor, inténtalo de nuevo.'));
  }
}