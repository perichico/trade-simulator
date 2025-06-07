import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Activo } from '../../models/activo.model';
import { Usuario } from '../../models/usuario.model';
import { Portafolio } from '../../models/portafolio.model';
import { ActivoService } from '../../services/activo.service';
import { AuthService } from '../../services/auth.service';
import { PortafolioService } from '../../services/portafolio.service';
import { TransaccionService } from '../../services/transaccion.service';

@Component({
  selector: 'app-transaccion',
  templateUrl: './transaccion.component.html',
  styleUrls: ['./transaccion.component.scss']
})
export class TransaccionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  activo: Activo | null = null;
  usuario: Usuario | null = null;
  portafolioActual: Portafolio | null = null;
  tipoTransaccion: 'compra' | 'venta' = 'compra';
  
  transaccionForm: FormGroup;
  procesandoTransaccion = false;
  cantidadDisponible = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private activoService: ActivoService,
    private authService: AuthService,
    private portafolioService: PortafolioService,
    private transaccionService: TransaccionService
  ) {
    this.transaccionForm = this.fb.group({
      cantidad: ['', [Validators.required, Validators.min(1)]],
      precioUnidad: [{ value: '', disabled: true }],
      costoTotal: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.verificarAutenticacion();
    this.procesarParametros();
    this.configurarFormulario();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private verificarAutenticacion(): void {
    this.authService.usuario$.pipe(takeUntil(this.destroy$)).subscribe(usuario => {
      this.usuario = usuario;
      if (!usuario) {
        this.router.navigate(['/login']);
      }
    });

    this.portafolioService.portafolioActual$.pipe(takeUntil(this.destroy$)).subscribe(portafolio => {
      this.portafolioActual = portafolio;
      this.actualizarCantidadDisponible();
    });
  }

  private procesarParametros(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const activoId = +params['activoId'];
      this.tipoTransaccion = params['tipo'] || 'compra';
      
      if (activoId) {
        this.cargarActivo(activoId);
      } else {
        this.router.navigate(['/mercado']);
      }
    });
  }

  private cargarActivo(activoId: number): void {
    this.activoService.obtenerActivoPorId(activoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (activo) => {
          this.activo = activo;
          this.transaccionForm.patchValue({
            precioUnidad: activo.ultimo_precio || activo.precio
          });
          this.actualizarCantidadDisponible();
        },
        error: (error) => {
          console.error('Error al cargar activo:', error);
          this.mostrarNotificacion('Error al cargar la información del activo', 'error');
          this.router.navigate(['/mercado']);
        }
      });
  }

  private configurarFormulario(): void {
    this.transaccionForm.get('cantidad')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(cantidad => {
        this.calcularCostoTotal();
        this.validarCantidad();
      });
  }

  private actualizarCantidadDisponible(): void {
    if (!this.portafolioActual?.activos || !this.activo) {
      this.cantidadDisponible = 0;
      return;
    }

    const activoEnPortafolio = this.portafolioActual.activos.find(
      a => a.activoId === this.activo!.id
    );
    this.cantidadDisponible = activoEnPortafolio?.cantidad || 0;
    
    // Actualizar validadores según el tipo de transacción
    this.actualizarValidadores();
  }

  private actualizarValidadores(): void {
    const cantidadControl = this.transaccionForm.get('cantidad');
    
    if (this.tipoTransaccion === 'venta') {
      cantidadControl?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(this.cantidadDisponible)
      ]);
    } else {
      cantidadControl?.setValidators([
        Validators.required,
        Validators.min(1)
      ]);
    }
    
    cantidadControl?.updateValueAndValidity();
  }

  private validarCantidad(): void {
    const cantidad = this.transaccionForm.get('cantidad')?.value || 0;
    
    if (this.tipoTransaccion === 'venta' && cantidad > this.cantidadDisponible) {
      this.transaccionForm.get('cantidad')?.setErrors({ 
        'cantidadInsuficiente': true 
      });
    }
  }

  private calcularCostoTotal(): void {
    const cantidad = this.transaccionForm.get('cantidad')?.value || 0;
    const precio = this.activo?.ultimo_precio || this.activo?.precio || 0;
    const total = cantidad * precio;
    
    this.transaccionForm.patchValue({
      costoTotal: total
    });
  }

  get saldoSuficiente(): boolean {
    const costoTotal = this.transaccionForm.get('costoTotal')?.value || 0;
    const saldoDisponible = this.portafolioActual?.saldo || 0;
    return this.tipoTransaccion === 'venta' || saldoDisponible >= costoTotal;
  }

  get puedeRealizarTransaccion(): boolean {
    if (!this.transaccionForm.valid || this.procesandoTransaccion) {
      return false;
    }

    if (this.tipoTransaccion === 'compra') {
      return this.saldoSuficiente;
    } else {
      const cantidad = this.transaccionForm.get('cantidad')?.value || 0;
      return cantidad <= this.cantidadDisponible && this.cantidadDisponible > 0;
    }
  }

  ejecutarTransaccion(): void {
    if (!this.puedeRealizarTransaccion || !this.activo) {
      return;
    }

    this.procesandoTransaccion = true;
    const cantidad = this.transaccionForm.get('cantidad')?.value;
    const portafolioId = this.portafolioActual?.id;

    this.transaccionService.crearTransaccion(
      this.activo.id,
      this.tipoTransaccion,
      cantidad,
      portafolioId
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (respuesta) => {
        this.procesandoTransaccion = false;
        const mensaje = `Transacción de ${this.tipoTransaccion} realizada con éxito`;
        this.mostrarNotificacion(mensaje, 'success');
        
        // Actualizar datos y navegar
        this.authService.verificarSesion();
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.procesandoTransaccion = false;
        const mensaje = error.error?.error || 'Error al realizar la transacción';
        this.mostrarNotificacion(mensaje, 'error');
      }
    });
  }

  cancelarTransaccion(): void {
    this.router.navigate(['/detalle-activo', this.activo?.id || '']);
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    // Implementar notificación (puedes usar MatSnackBar o similar)
    alert(mensaje);
  }

  // Métodos helper para el template
  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(valor || 0);
  }

  get tituloTransaccion(): string {
    return this.tipoTransaccion === 'compra' ? 'Comprar' : 'Vender';
  }

  get colorBoton(): string {
    return this.tipoTransaccion === 'compra' ? 'btn-success' : 'btn-danger';
  }

  get iconoTransaccion(): string {
    return this.tipoTransaccion === 'compra' ? 'bi-cart-plus' : 'bi-cart-dash';
  }
}
