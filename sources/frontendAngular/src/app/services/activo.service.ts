import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Activo } from '../models/activo.model';

@Injectable({
  providedIn: 'root'
})
export class ActivoService {
  private apiUrl = 'http://localhost:3000'; // URL del backend

  constructor(private http: HttpClient) { }

  // Obtener todos los activos disponibles
  obtenerActivos(): Observable<Activo[]> {
    return this.http.get<Activo[]>(`${this.apiUrl}/activos`)
      .pipe(
        map(activos => {
          // Usar los precios reales del backend que ya consulta Yahoo Finance
          return activos.map(activo => {
            const precioAnterior = activo.precio || activo.ultimo_precio;
            const precioActual = activo.ultimo_precio;
            const variacion = precioAnterior ? ((precioActual - precioAnterior) / precioAnterior) * 100 : 0;
            
            return {
              ...activo,
              precio: precioActual,
              variacion: parseFloat(variacion.toFixed(2)),
              tendencia: this.determinarTendencia(variacion)
            };
          });
        }),
        catchError(error => {
          console.error('Error al obtener activos', error);
          return of([]); // Devolver array vacío en caso de error
        })
      );
  }

  // Obtener un activo por su ID
  obtenerActivoPorId(id: number): Observable<Activo> {
    return this.http.get<Activo>(`${this.apiUrl}/activos/${id}`)
      .pipe(
        map(activo => {
          const precioAnterior = activo.precio || activo.ultimo_precio;
          const precioActual = activo.ultimo_precio;
          const variacion = precioAnterior ? ((precioActual - precioAnterior) / precioAnterior) * 100 : 0;
          
          return {
            ...activo,
            precio: precioActual,
            variacion: parseFloat(variacion.toFixed(2)),
            tendencia: this.determinarTendencia(variacion)
          };
        }),
        catchError(error => {
          console.error(`Error al obtener activo con ID ${id}`, error);
          throw error;
        })
      );
  }

  // Método auxiliar para determinar la tendencia basada en la variación
  private determinarTendencia(variacion: number): 'alza' | 'baja' | 'estable' {
    if (variacion > 0.5) return 'alza';
    if (variacion < -0.5) return 'baja';
    return 'estable';
  }
}