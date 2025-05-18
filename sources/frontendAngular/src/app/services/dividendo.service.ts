import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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
    return this.http.get<Dividendo[]>(`${this.apiUrl}/api/dividendos`)
      .pipe(
        tap(data => console.log('Dividendos obtenidos:', data)),
        catchError(error => {
          console.error('Error al obtener dividendos', error);
          return of([]);
        })
      );
  }

  obtenerDividendosPorUsuario(): Observable<Dividendo[]> {
    return this.http.get<Dividendo[]>(`${this.apiUrl}/api/dividendos/usuario`)
      .pipe(
        tap(data => console.log('Dividendos del usuario obtenidos:', data)),
        catchError(error => {
          console.error('Error al obtener dividendos del usuario', error);
          return of([]);
        })
      );
  }

  crearDividendo(dividendo: Dividendo): Observable<Dividendo> {
    return this.http.post<Dividendo>(`${this.apiUrl}/api/dividendos`, dividendo)
      .pipe(
        tap(data => console.log('Dividendo creado:', data)),
        catchError(error => {
          console.error('Error al crear dividendo', error);
          throw error;
        })
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
}