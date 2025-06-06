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
      // Buscar TODOS los activos con el mismo ID en el portafolio, manejando diferentes formatos
      const activosEnPortafolio = this.portafolioActual.activos?.filter(a => {
        const activoIdEnPortafolio = a.activoId || (a as any).id || (a as any).activo_id;
        return activoIdEnPortafolio === this.activo?.id;
      });
      
      if (activosEnPortafolio && activosEnPortafolio.length > 0) {
        // Sumar todas las cantidades del mismo activo
        this.cantidadDisponible = activosEnPortafolio.reduce((total, activo) => {
          const cantidad = parseFloat((activo.cantidad || 0).toString());
          return total + cantidad;
        }, 0);
        console.log(`Cantidad disponible calculada para ${this.activo.simbolo}: ${this.cantidadDisponible}`);
      } else {
        this.cantidadDisponible = 0;
        console.log(`No se encontraron activos ${this.activo.simbolo} en el portafolio`);
        console.log('Activos en portafolio:', this.portafolioActual.activos);
        console.log('ID del activo buscado:', this.activo.id);
      }
    } else if (this.tipo === 'compra' && this.portafolioActual && this.activo) {
      // Para compra, también calcular cuántos ya tiene para mostrar información
      const activosEnPortafolio = this.portafolioActual.activos?.filter(a => {
        const activoIdEnPortafolio = a.activoId || (a as any).id || (a as any).activo_id;
        return activoIdEnPortafolio === this.activo?.id;
      });
      
      if (activosEnPortafolio && activosEnPortafolio.length > 0) {
        this.cantidadDisponible = activosEnPortafolio.reduce((total, activo) => {
          return total + (activo.cantidad || 0);
        }, 0);
      } else {
        this.cantidadDisponible = 0;
      }
    } else {
      this.cantidadDisponible = 0;
    }
  }

  calcularCostoTotal(): void {
    if (this.activo) {
      // Usar ultimo_precio si precio no está disponible
      const precio = this.activo.precio || this.activo.ultimo_precio || 0;
      
      console.log('=== DEBUG CÁLCULO COSTO ===');
      console.log('Activo:', this.activo);
      console.log('Precio usado:', precio);
      console.log('Cantidad:', this.cantidad);
      console.log('===========================');
      
      if (precio > 0) {
        this.costoTotal = this.cantidad * precio;
        
        if (this.tipo === 'compra') {
          this.saldoRestante = this.saldoActual - this.costoTotal;
        } else {
          this.saldoRestante = this.saldoActual + this.costoTotal;
        }
      } else {
        console.warn('Precio del activo es 0 o inválido');
        this.costoTotal = 0;
        this.saldoRestante = this.saldoActual;
      }
    } else {
      console.warn('No hay activo disponible para calcular costo');
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
    console.log('=== DEBUG VALIDACIÓN TRANSACCIÓN ===');
    console.log('Activo:', !!this.activo);
    console.log('Cantidad:', this.cantidad);
    console.log('Procesando:', this.procesandoTransaccion);
    console.log('Precio activo:', this.getPrecioActivo());
    console.log('Costo total:', this.costoTotal);
    console.log('Saldo actual:', this.saldoActual);
    console.log('================================');

    // Separar las validaciones básicas del estado de procesamiento
    if (!this.activo || this.cantidad < 1) {
      console.log('Falló validación básica: activo o cantidad inválida');
      return false;
    }

    // Verificar que haya un precio válido
    const precio = this.getPrecioActivo();
    if (precio <= 0) {
      console.log('Precio inválido:', precio);
      return false;
    }

    // Validaciones específicas por tipo de transacción
    if (this.tipo === 'compra') {
      const puedeComprar = this.saldoActual >= this.costoTotal;
      console.log('Puede comprar:', puedeComprar);
      return puedeComprar;
    } else {
      const puedeVender = this.cantidadDisponible >= this.cantidad;
      console.log('Puede vender:', puedeVender);
      return puedeVender;
    }
  }

  cambiarTipoTransaccion(nuevoTipo: 'compra' | 'venta'): void {
    if (this.procesandoTransaccion) return;
    
    this.tipo = nuevoTipo;
    this.calcularCantidadDisponible();
    this.calcularCostoTotal();
  }

  puedeIniciarTransaccion(): boolean {
    return this.puedeRealizarTransaccion() && !this.procesandoTransaccion;
  }

  confirmarTransaccion(): void {
    console.log('=== INICIANDO TRANSACCIÓN ===');
    console.log('Puede realizar transacción:', this.puedeRealizarTransaccion());
    console.log('Puede iniciar transacción:', this.puedeIniciarTransaccion());
    
    if (!this.puedeIniciarTransaccion() || !this.activo) {
      console.log('No se puede iniciar la transacción');
      return;
    }

    this.procesandoTransaccion = true;
    const portafolioId = this.portafolioActual?.id;

    console.log('Datos de transacción:', {
      activoId: this.activo.id,
      tipo: this.tipo,
      cantidad: this.cantidad,
      portafolioId: portafolioId
    });

    this.transaccionService.crearTransaccion(this.activo.id, this.tipo, this.cantidad, portafolioId)
      .subscribe({
        next: (respuesta) => {
          console.log('Transacción exitosa:', respuesta);
          this.procesandoTransaccion = false; // Resetear el estado
          const accion = this.tipo === 'compra' ? 'Compra' : 'Venta';
          const mensaje = `${accion} de ${this.cantidad} ${this.activo?.simbolo} realizada con éxito`;
          this.navegarConNotificacion(mensaje, 'success');
        },
        error: (error) => {
          console.error('Error en transacción:', error);
          this.procesandoTransaccion = false; // Resetear el estado también en error
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

  navegarConNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    // Por ahora mostramos un alert, pero puedes implementar un sistema de notificaciones más sofisticado
    if (tipo === 'success') {
      alert(mensaje);
    } else {
      alert(mensaje);
    }
    this.router.navigate(['/dashboard']);
  }
}
