import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PatrimonioHistorico {
  fecha: string;
  balance: number;
  valorPortafolio: number;
  patrimonioTotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class PatrimonioService {
  private apiUrl = `${environment.apiUrl}/patrimonio`;

  constructor(private http: HttpClient) {}

  obtenerHistorialPatrimonio(usuarioId: number): Observable<PatrimonioHistorico[]> {
    return this.http.get<PatrimonioHistorico[]>(`${this.apiUrl}/historial/${usuarioId}`);
  }
}