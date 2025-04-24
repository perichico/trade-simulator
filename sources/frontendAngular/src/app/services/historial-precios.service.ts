import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HistorialPrecio {
  id: number;
  activo_id: number;
  precio: number;
  fecha: string;
}

@Injectable({
  providedIn: 'root'
})
export class HistorialPreciosService {
  private apiUrl = `${environment.apiUrl}/historial-precios`;

  constructor(private http: HttpClient) {}

  obtenerHistorialPrecios(activoId: number, fechaInicio?: Date, fechaFin?: Date): Observable<HistorialPrecio[]> {
    let url = `${this.apiUrl}/${activoId}`;
    
    if (fechaInicio || fechaFin) {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fechaInicio', fechaInicio.toISOString());
      if (fechaFin) params.append('fechaFin', fechaFin.toISOString());
      url += `?${params.toString()}`;
    }

    return this.http.get<HistorialPrecio[]>(url);
  }
}