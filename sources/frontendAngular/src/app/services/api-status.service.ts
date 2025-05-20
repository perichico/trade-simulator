import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiStatusService {
  private apiUrl = environment.apiUrl;
  private isApiAvailableSubject = new BehaviorSubject<boolean>(false);
  public isApiAvailable$ = this.isApiAvailableSubject.asObservable();

  constructor(private http: HttpClient) {
    // Verificar estado de la API al iniciar
    this.checkApiStatus();
    
    // Verificar periódicamente el estado de la API (cada 30 segundos)
    setInterval(() => this.checkApiStatus(), 30000);
  }

  checkApiStatus(): void {
    console.log('Verificando disponibilidad de la API...');
    
    // Usamos una ruta de health check o una simple
    this.http.get(`${this.apiUrl}/api/health`, { responseType: 'text' })
      .pipe(
        timeout(5000),
        tap(() => {
          console.log('API disponible');
          this.isApiAvailableSubject.next(true);
        }),
        catchError(error => {
          console.warn('API no disponible:', error);
          this.isApiAvailableSubject.next(false);
          return of('API no disponible');
        })
      )
      .subscribe();
  }

  getApiStatus(): boolean {
    return this.isApiAvailableSubject.value;
  }
}
