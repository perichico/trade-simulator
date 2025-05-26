import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransaccionService } from '../../services/transaccion.service';
import { AuthService } from '../../services/auth.service';
import { PortafolioService } from '../../services/portafolio.service';
import { ActivoService } from '../../services/activo.service';
import { Activo } from '../../models/activo.model';
import { Usuario } from '../../models/usuario.model';
import { Portafolio } from '../../models/portafolio.model';

@Component({
  selector: 'app-transaccion',
  templateUrl: './transaccion.component.html',
  styleUrls: ['./transaccion.component.scss']
})
export class TransaccionComponent implements OnInit {
  activo: Activo | null = null;
  usuario: Usuario | null = null;
  portafolioActual: Portafolio | null = null;
  
  tipo: 'compra' | 'venta' = 'compra';
  cantidad: number = 1;
  cantidadDisponible: number = 0;
  costoTotal: number = 0;
  saldoActual: number = 0;
  saldoRestante: number = 0;
  
  procesandoTransaccion: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transaccionService: TransaccionService,
    private authService: AuthService,
    private portafolioService: PortafolioService,
    private activoService: ActivoService
  ) { }

  ngOnInit(): void {
    // Obtener parámetros de la ruta
    this.route.queryParams.subscribe(params => {
      this.tipo = params['tipo'] || 'compra';
      const activoId = +params['activoId'];
      
      if (activoId) {
        this.cargarActivo(activoId);
      }
    });

    // Obtener usuario actual
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
    });

    // Obtener portafolio actual
    this.portafolioService.portafolioActual$.subscribe(portafolio => {
      this.portafolioActual = portafolio;
      this.saldoActual = portafolio?.saldo || 0;
      this.calcularCantidadDisponible();
      this.calcularCostoTotal();
    });
  }

  cargarActivo(id: number): void {
    this.activoService.obtenerActivoPorId(id).subscribe({
      next: (activo) => {
        this.activo = activo;
        console.log('Activo cargado:', activo); // Para debug
        this.calcularCostoTotal();
      },
      error: (error) => {
        console.error('Error al cargar el activo:', error);
        alert('Error al cargar la información del activo');
        this.router.navigate(['/dashboard']); // O la ruta principal que tengas
      }
    });
  }

  calcularCantidadDisponible(): void {
    if (this.tipo === 'venta' && this.portafolioActual && this.activo) {
      const activoEnPortafolio = this.portafolioActual.activos?.find(a => a.activoId === this.activo?.id);
      this.cantidadDisponible = activoEnPortafolio?.cantidad || 0;
    }
  }

  calcularCostoTotal(): void {
    if (this.activo) {
      // Usar ultimo_precio si precio no está disponible
      const precio = this.activo.precio || this.activo.ultimo_precio || 0;
      
      if (precio > 0) {
        this.costoTotal = this.cantidad * precio;
        
        if (this.tipo === 'compra') {
          this.saldoRestante = this.saldoActual - this.costoTotal;
        } else {
          this.saldoRestante = this.saldoActual + this.costoTotal;
        }
      } else {
        this.costoTotal = 0;
        this.saldoRestante = this.saldoActual;
      }
    } else {
      this.costoTotal = 0;
      this.saldoRestante = this.saldoActual;
    }
  }

  onCantidadInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.cantidad = parseInt(target.value) || 1;
    this.onCantidadChange();
  }

  onCantidadChange(): void {
    if (this.cantidad < 1) {
      this.cantidad = 1;
    }
    
    if (this.tipo === 'venta' && this.cantidad > this.cantidadDisponible) {
      this.cantidad = this.cantidadDisponible;
    }
    
    this.calcularCostoTotal();
  }

  formatearPrecio(precio: number | undefined): string {
    if (precio === undefined || precio === null) return '$0.00';
    return `$${precio.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  puedeRealizarTransaccion(): boolean {
    if (!this.activo || this.cantidad < 1 || this.procesandoTransaccion) {
      return false;
    }

    // Verificar que haya un precio válido
    const precio = this.activo.precio || this.activo.ultimo_precio || 0;
    if (precio <= 0) {
      return false;
    }

    if (this.tipo === 'compra') {
      return this.saldoActual >= this.costoTotal;
    } else {
      return this.cantidadDisponible >= this.cantidad;
    }
  }

  private navegarConNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info'): void {
    this.router.navigate(['/notificacion-temporal'], {
      queryParams: {
        mensaje: mensaje,
        tipo: tipo,
        retorno: '/dashboard'
      }
    });
  }

  confirmarTransaccion(): void {
    if (!this.puedeRealizarTransaccion() || !this.activo) {
      return;
    }

    this.procesandoTransaccion = true;
    const portafolioId = this.portafolioActual?.id;

    this.transaccionService.crearTransaccion(this.activo.id, this.tipo, this.cantidad, portafolioId)
      .subscribe({
        next: (respuesta) => {
          const accion = this.tipo === 'compra' ? 'Compra' : 'Venta';
          const mensaje = `${accion} de ${this.cantidad} ${this.activo?.simbolo} realizada con éxito`;
          this.navegarConNotificacion(mensaje, 'success');
        },
        error: (error) => {
          this.procesandoTransaccion = false;
          const mensaje = `Error al realizar la transacción: ${error.error?.error || 'Error desconocido'}`;
          this.navegarConNotificacion(mensaje, 'error');
        }
      });
  }

  cancelar(): void {
    this.router.navigate(['/dashboard']); // O la ruta principal que tengas
  }

  getMensajeConfirmacion(): string {
    if (!this.activo) return '';
    
    const accion = this.tipo === 'compra' ? 'comprar' : 'vender';
    return `¿Confirmas que deseas ${accion} ${this.cantidad} ${this.cantidad === 1 ? 'unidad' : 'unidades'} de ${this.activo.simbolo}?`;
  }

  getPrecioActivo(): number {
    if (!this.activo) return 0;
    return this.activo.precio || this.activo.ultimo_precio || 0;
  }
}
