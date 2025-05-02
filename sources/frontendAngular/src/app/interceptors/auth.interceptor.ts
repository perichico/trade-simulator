import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Solo aplicamos withCredentials a las peticiones que van a nuestro API
    if (request.url.startsWith(environment.apiUrl)) {
      const authReq = request.clone({
        withCredentials: true,
        headers: request.headers.set('X-Requested-With', 'XMLHttpRequest')
      });
      
      return next.handle(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // Si recibimos un 401 (No autorizado) o 403 (Prohibido), redirigimos al login
          if (error.status === 401 || error.status === 403) {
            this.router.navigate(['/login']);
          }
          return throwError(() => error);
        })
      );
    }
    return next.handle(request);
  }
}