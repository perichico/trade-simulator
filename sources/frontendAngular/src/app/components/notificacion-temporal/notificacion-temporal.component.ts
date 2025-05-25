import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-notificacion-temporal',
  templateUrl: './notificacion-temporal.component.html',
  styleUrls: ['./notificacion-temporal.component.scss']
})
export class NotificacionTemporalComponent implements OnInit {
  mensaje: string = '';
  tipo: 'success' | 'error' | 'info' = 'success';
  rutaRetorno: string = '/dashboard';
  tiempoRestante: number = 3;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Obtener parámetros de la query
    this.route.queryParams.subscribe(params => {
      this.mensaje = params['mensaje'] || 'Operación realizada';
      this.tipo = params['tipo'] || 'success';
      this.rutaRetorno = params['retorno'] || '/dashboard';
    });

    // Iniciar countdown y redirección automática
    this.iniciarCountdown();
  }

  private iniciarCountdown(): void {
    const interval = setInterval(() => {
      this.tiempoRestante--;
      
      if (this.tiempoRestante <= 0) {
        clearInterval(interval);
        this.regresar();
      }
    }, 1000);
  }

  regresar(): void {
    this.router.navigate([this.rutaRetorno]);
  }

  getIcono(): string {
    switch (this.tipo) {
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-x-circle-fill';
      case 'info': return 'bi-info-circle-fill';
      default: return 'bi-check-circle-fill';
    }
  }

  getTitulo(): string {
    switch (this.tipo) {
      case 'success': return '¡Éxito!';
      case 'error': return 'Error';
      case 'info': return 'Información';
      default: return '¡Éxito!';
    }
  }

  getClaseCard(): string {
    return `notificacion-card ${this.tipo}`;
  }
}
