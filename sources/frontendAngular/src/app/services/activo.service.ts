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
  private apiUrl = environment.apiUrl; // URL del backend

  constructor(private http: HttpClient) { }

  // Obtener todos los activos disponibles con opción de filtrado por tipo
  obtenerActivos(tipoActivoId?: number): Observable<Activo[]> {
    const params = tipoActivoId ? { params: new HttpParams().set('tipo_activo_id', tipoActivoId.toString()) } : {};
    return this.http.get<Activo[]>(`${this.apiUrl}/activos`, params)
      .pipe(
        map(activos => {
          return activos.map(activo => {
            const variacion = this.procesarVariacion(activo.variacion);
            return {
              ...activo,
              precio: activo.ultimo_precio,
              variacion: variacion,
              tendencia: this.determinarTendencia(variacion),
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
    console.log('Obteniendo activo por ID:', id);
    
    return this.http.get<Activo>(`${this.apiUrl}/activos/${id}`)
      .pipe(
        map(activo => {
          console.log('=== ACTIVO COMPLETO DEL SERVIDOR ===');
          console.log(JSON.stringify(activo, null, 2));
          console.log('=====================================');
          
          // Verificar que el ID del activo recibido coincida con el solicitado
          if (activo.id !== id) {
            console.error(`ID del activo no coincide. Solicitado: ${id}, Recibido: ${activo.id}`);
            throw new Error(`El activo recibido no corresponde al ID solicitado`);
          }
          
          const variacion = this.procesarVariacion(activo.variacion);
          console.log('Variación final procesada:', variacion);
          
          return {
            ...activo,
            precio: activo.ultimo_precio,
            variacion: variacion,
            tendencia: this.determinarTendencia(variacion),
            ultima_actualizacion: activo.ultima_actualizacion ? new Date(activo.ultima_actualizacion) : new Date(),
            tipoActivo: activo.tipoActivo || { id: 1, nombre: 'Acción' },
            tipo: this.mapearTipoActivo(activo.tipoActivo?.nombre)
          };
        }),
        catchError((error) => {
          console.error('Error al obtener activo por ID:', error);
          return throwError(() => error);
        })
      );
  }

  // Método auxiliar para procesar la variación del backend
  private procesarVariacion(variacion: any): number {
    console.log('=== DEBUG VARIACIÓN ===');
    console.log('Variación original del backend:', variacion);
    console.log('Tipo de variación:', typeof variacion);
    console.log('Es null?:', variacion === null);
    console.log('Es undefined?:', variacion === undefined);
    console.log('========================');
    
    // Si ya es un número válido, devolverlo
    if (typeof variacion === 'number' && !isNaN(variacion)) {
      console.log('Variación es número válido:', variacion);
      return variacion;
    }
    
    // Si es string, intentar convertir
    if (typeof variacion === 'string') {
      const parsed = parseFloat(variacion);
      console.log('Variación convertida de string:', parsed);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    // Si es null, undefined o cualquier otro tipo, devolver 0
    console.log('Variación no válida, devolviendo 0');
    return 0;
  }

  // Método auxiliar para determinar la tendencia basada en la variación
  private determinarTendencia(variacion: number): 'alza' | 'baja' | 'estable' {
    if (variacion > 0.5) return 'alza';
    if (variacion < -0.5) return 'baja';
    return 'estable';
  }

  // Método auxiliar para mapear el tipo de activo
  private mapearTipoActivo(nombreTipo?: string): 'accion' | 'criptomoneda' | 'materia_prima' | 'divisa' {
    if (!nombreTipo) return 'accion';
    
    const tipoLower = nombreTipo.toLowerCase();
    if (tipoLower.includes('criptomoneda') || tipoLower.includes('crypto')) return 'criptomoneda';
    if (tipoLower.includes('materia') || tipoLower.includes('commodity')) return 'materia_prima';
    if (tipoLower.includes('divisa') || tipoLower.includes('forex')) return 'divisa';
    return 'accion';
  }

  // Método para manejar errores
  private handleError(error: any): void {
    console.error('Error en el servicio de activos:', error);
  }
}