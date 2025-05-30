import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-usuario-suspendido',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div class="row">
        <div class="col-12">
          <div class="card shadow-lg border-0" style="max-width: 500px;">
            <div class="card-body text-center p-5">
              <div class="mb-4">
                <i class="bi bi-exclamation-triangle-fill text-warning" style="font-size: 4rem;"></i>
              </div>
              
              <h2 class="card-title text-warning mb-3">Cuenta Suspendida</h2>
              
              <p class="card-text text-muted mb-4">
                Tu cuenta ha sido suspendida temporalmente. 
                Por favor, contacta al administrador para más información sobre la suspensión.
              </p>
              
              <div class="alert alert-warning" role="alert">
                <strong>¿Qué significa esto?</strong><br>
                No puedes acceder a las funcionalidades del sistema hasta que un administrador reactive tu cuenta.
              </div>
              
              <div class="d-grid gap-2">
                <button 
                  class="btn btn-primary" 
                  (click)="contactarSoporte()">
                  <i class="bi bi-envelope me-2"></i>
                  Contactar Soporte
                </button>
                
                <button 
                  class="btn btn-outline-secondary" 
                  (click)="cerrarSesion()">
                  <i class="bi bi-box-arrow-right me-2"></i>
                  Cerrar Sesión
                </button>
              </div>
              
              <hr class="my-4">
              
              <small class="text-muted">
                Si crees que esto es un error, ponte en contacto con el administrador del sistema.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border-radius: 15px;
    }
    
    .btn {
      border-radius: 8px;
    }
    
    .alert {
      border-radius: 8px;
    }
  `]
})
export class UsuarioSuspendidoComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Evitar redirecciones automáticas
    // Verificar periódicamente el estado de suspensión
    this.verificarEstadoPeriodicamente();
  }

  private verificarEstadoPeriodicamente() {
    // Implementar verificación periódica cada 30 segundos
    setInterval(() => {
      if (!this.usuarioSigueSuspendido()) {
        this.router.navigate(['/dashboard']);
      }
    }, 30000);
  }

  private usuarioSigueSuspendido(): boolean {
    // Implementar lógica de verificación
    return true; // placeholder
  }

  contactarSoporte(): void {
    // Simular contacto con soporte - en producción esto podría abrir un modal de contacto
    alert('Por favor, envía un email a soporte@tradesimulator.com o contacta al administrador del sistema.');
  }

  cerrarSesion(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        // Forzar navegación al login aunque haya error
        this.router.navigate(['/login']);
      }
    });
  }
}
