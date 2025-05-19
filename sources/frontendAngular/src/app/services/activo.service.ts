import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Activo } from '../models/activo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActivoService {
  private apiUrl = environment.apiUrl; // URL del backend

  constructor(private http: HttpClient) { }

  // Obtener todos los activos disponibles con opción de filtrado por tipo
  obtenerActivos(tipoActivoId?: number): Observable<Activo[]> {
    const params = tipoActivoId ? { params: new HttpParams().set('tipo_activo_id', tipoActivoId.toString()) } : {};
    return this.http.get<Activo[]>(`${this.apiUrl}/activos`, params)
      .pipe(
        map(activos => {
          return activos.map(activo => {
            return {
              ...activo,
              precio: activo.ultimo_precio,
              variacion: activo.variacion ?? 0,
              tendencia: this.determinarTendencia(activo.variacion ?? 0),
              tipo: (activo.tipoActivo?.nombre.toLowerCase() as 'accion' | 'criptomoneda' | 'materia_prima' | 'divisa') || 'accion'
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
          return {
            ...activo,
            precio: activo.ultimo_precio,
            variacion: activo.variacion ?? 0,
            tendencia: this.determinarTendencia(activo.variacion ?? 0)
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