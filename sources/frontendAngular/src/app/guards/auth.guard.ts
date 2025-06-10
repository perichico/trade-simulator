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
    state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.verificarSesion().pipe(
      map(autenticado => {
        const usuario = this.authService.obtenerUsuario();
        
        if (!autenticado || !usuario) {
          this.router.navigate(['/login']);
          return false;
        }
        
        // Verificar si el usuario está suspendido
        if (usuario.estado === 'suspendido') {
          this.router.navigate(['/usuario-suspendido']);
          return false;
        }
        
        // Verificar si la ruta requiere permisos de admin
        const requiereAdmin = route.data?.['requiereAdmin'];
        if (requiereAdmin && usuario.rol !== 'admin') {
          this.router.navigate(['/dashboard']);
          return false;
        }
        
        return true;
      }),
      catchError((error) => {
        // Manejar errores de rate limiting
        if (error.status === 429) {
          console.warn('Rate limit excedido:', error.error);
          // Mostrar mensaje específico al usuario
          // this.notificationService.showError(error.error.mensaje);
        }
        
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}