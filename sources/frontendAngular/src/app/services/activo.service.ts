import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { Activo } from '../models/activo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActivoService {
  private apiUrl = `${environment.apiUrl}/api/activos`; // URL del backend

  constructor(private http: HttpClient) { }

  // Obtener todos los activos disponibles con opción de filtrado por tipo
  obtenerActivos(tipoActivoId?: number): Observable<Activo[]> {
    let params = new HttpParams();
    if (tipoActivoId) {
      params = params.set('tipo_activo_id', tipoActivoId.toString());
    }

    return this.http.get<any[]>(this.apiUrl, { params })
      .pipe(
        map(activos => activos.map(activo => this.mapearActivo(activo))),
        catchError(error => {
          console.error('Error al obtener activos:', error);
          return of([]); // Devolver array vacío en caso de error
        })
      );
  }

  // Obtener un activo por su ID
  obtenerActivoPorId(id: number): Observable<Activo> {
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(
        map(activo => this.mapearActivo(activo)),
        catchError((error) => {
          console.error('Error al obtener activo por ID:', error);
          return throwError(() => error);
        })
      );
  }

  // Crear un nuevo activo
  crearActivo(activo: Partial<Activo>): Observable<Activo> {
    const activoData = {
      nombre: activo.nombre,
      simbolo: activo.simbolo,
      tipo_activo_id: activo.tipo_activo_id || activo.tipoActivo?.id || 1
    };

    return this.http.post<any>(this.apiUrl, activoData)
      .pipe(
        map(response => this.mapearActivo(response)),
        catchError(error => {
          console.error('Error al crear activo:', error);
          return throwError(() => error);
        })
      );
  }

  // Actualizar un activo existente
  actualizarActivo(id: number, activo: Partial<Activo>): Observable<Activo> {
    const activoData = {
      nombre: activo.nombre,
      simbolo: activo.simbolo,
      tipo_activo_id: activo.tipo_activo_id || activo.tipoActivo?.id
    };

    return this.http.put<any>(`${this.apiUrl}/${id}`, activoData)
      .pipe(
        map(response => this.mapearActivo(response)),
        catchError(error => {
          console.error('Error al actualizar activo:', error);
          return throwError(() => error);
        })
      );
  }

  // Eliminar un activo por su ID
  eliminarActivo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error al eliminar activo:', error);
          return throwError(() => error);
        })
      );
  }

  // Método auxiliar para mapear los datos del activo
  private mapearActivo(activo: any): Activo {
    return {
      id: activo.id,
      nombre: activo.nombre,
      simbolo: activo.simbolo,
      ultimo_precio: parseFloat(activo.ultimo_precio) || 0,
      ultima_actualizacion: new Date(activo.ultima_actualizacion),
      tipo: this.determinarTipo(activo.tipo_activo_id),
      tipo_activo_id: activo.tipo_activo_id || 1,
      tipoActivo: activo.tipoActivo || activo.TipoActivo || {
        id: activo.tipo_activo_id || 1,
        nombre: this.obtenerNombreTipo(activo.tipo_activo_id)
      },
      variacion: activo.variacion || 0,
      precio: parseFloat(activo.ultimo_precio) || 0
    };
  }

  // Método auxiliar para determinar el tipo de activo
  private determinarTipo(tipo_activo_id: number): 'accion' | 'criptomoneda' | 'materia_prima' | 'divisa' {
    switch (tipo_activo_id) {
      case 1: return 'accion';
      case 4: return 'criptomoneda';
      case 5: return 'materia_prima';
      case 6: return 'divisa';
      default: return 'accion';
    }
  }

  // Método auxiliar para obtener el nombre del tipo de activo
  private obtenerNombreTipo(tipo_activo_id: number): string {
    switch (tipo_activo_id) {
      case 1: return 'Acción';
      case 2: return 'Bono';
      case 3: return 'ETF';
      case 4: return 'Criptomoneda';
      case 5: return 'Materia Prima';
      case 6: return 'Divisa';
      default: return 'Acción';
    }
  }
}