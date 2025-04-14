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
          // Añadir propiedades adicionales para la UI
          return activos.map(activo => ({
            ...activo,
            variacion: this.generarVariacionAleatoria(), // En una app real, esto vendría del backend
            tendencia: this.determinarTendencia(this.generarVariacionAleatoria())
          }));
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
        map(activo => ({
          ...activo,
          variacion: this.generarVariacionAleatoria(),
          tendencia: this.determinarTendencia(this.generarVariacionAleatoria())
        })),
        catchError(error => {
          console.error(`Error al obtener activo con ID ${id}`, error);
          throw error;
        })
      );
  }

  // Método auxiliar para generar variaciones aleatorias de precio (simulación)
  private generarVariacionAleatoria(): number {
    return parseFloat((Math.random() * 6 - 3).toFixed(2)); // Entre -3% y +3%
  }

  // Método auxiliar para determinar la tendencia basada en la variación
  private determinarTendencia(variacion: number): 'alza' | 'baja' | 'estable' {
    if (variacion > 0.5) return 'alza';
    if (variacion < -0.5) return 'baja';
    return 'estable';
  }

  // Método para simular cambios de precio en tiempo real (para demo)
  simularCambioPrecio(activo: Activo): Activo {
    const variacion = this.generarVariacionAleatoria();
    const nuevoPrecio = parseFloat((activo.precio * (1 + variacion / 100)).toFixed(2));
    
    return {
      ...activo,
      precio: nuevoPrecio,
      variacion: variacion,
      tendencia: this.determinarTendencia(variacion)
    };
  }
}