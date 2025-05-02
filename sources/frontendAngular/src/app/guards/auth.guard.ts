import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { map, take, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Primero verificamos la sesión con el backend
    return this.authService.verificarSesion().pipe(
      switchMap(estaAutenticado => {
        if (estaAutenticado) {
          return this.authService.usuario$.pipe(
            take(1),
            map(usuario => {
              if (usuario) {
                return true;
              } else {
                this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
                return false;
              }
            })
          );
        } else {
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return of(false);
        }
      })
    );
  }
}