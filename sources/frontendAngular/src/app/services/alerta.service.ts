import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, retry, timeout } from 'rxjs/operators';
import { Alerta } from '../models/alerta.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlertaService {
  private apiUrl = `${environment.apiUrl}/api/alertas`;
  private alertasSubject = new BehaviorSubject<Alerta[]>([]);
  public alertas$ = this.alertasSubject.asObservable();

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('Error en AlertaService:', error);
    
    let errorMessage = 'Error desconocido';
    
    if (error.status === 0) {
      errorMessage = 'No se puede conectar con el servidor';
    } else if (error.status === 401) {
      errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para realizar esta acción';
    } else if (error.status === 404) {
      errorMessage = 'Recurso no encontrado';
    } else if (error.status >= 500) {
      errorMessage = 'Error interno del servidor';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  obtenerAlertasUsuario(): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(this.apiUrl)
      .pipe(
        timeout(10000),
        retry(1),
        tap(alertas => {
          this.alertasSubject.next(alertas);
        }),
        catchError(this.handleError)
      );
  }

  crearAlerta(alerta: Alerta): Observable<Alerta> {
    return this.http.post<Alerta>(this.apiUrl, alerta)
      .pipe(
        tap(() => {
          // Recargar la lista de alertas después de crear una nueva
          this.obtenerAlertasUsuario().subscribe();
        }),
        catchError(this.handleError)
      );
  }

  activarAlerta(id: number): Observable<Alerta> {
    return this.http.patch<Alerta>(`${this.apiUrl}/${id}/activar`, {})
      .pipe(
        tap(() => {
          this.obtenerAlertasUsuario().subscribe();
        }),
        catchError(this.handleError)
      );
  }

  desactivarAlerta(id: number): Observable<Alerta> {
    return this.http.patch<Alerta>(`${this.apiUrl}/${id}/desactivar`, {})
      .pipe(
        tap(() => {
          this.obtenerAlertasUsuario().subscribe();
        }),
        catchError(this.handleError)
      );
  }

  eliminarAlerta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          this.obtenerAlertasUsuario().subscribe();
        }),
        catchError(this.handleError)
      );
  }

  // Método para refrescar las alertas
  refrescarAlertas(): void {
    this.obtenerAlertasUsuario().subscribe();
  }
}