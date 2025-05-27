import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {
    
    return this.authService.usuario$.pipe(
      take(1),
      map(usuario => {
        if (!usuario) {
          this.router.navigate(['/login']);
          return false;
        }

        // Verificar si requiere permisos de administrador
        if (route.data?.['requiereAdmin'] && usuario.rol !== 'admin') {
          this.router.navigate(['/dashboard']);
          return false;
        }

        return true;
      })
    );
  }
}