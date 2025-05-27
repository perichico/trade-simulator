import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Verificar si requiere rol de administrador
    const requiereAdmin = route.data['requiereAdmin'];
    
    return this.authService.verificarSesion().pipe(
      map(autenticado => {
        if (!autenticado) {
          this.router.navigate(['/login']);
          return false;
        }

        // Si requiere admin, verificar rol
        if (requiereAdmin && !this.authService.esAdministrador()) {
          this.router.navigate(['/dashboard']);
          return false;
        }

        return true;
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}