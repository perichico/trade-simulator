import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subscription, interval, of } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import { Activo } from '../../models/activo.model';
import { Usuario } from '../../models/usuario.model';
import { Portafolio } from '../../models/portafolio.model';
import { ActivoService } from '../../services/activo.service';
import { AuthService } from '../../services/auth.service';
import { TransaccionDialogComponent } from '../transaccion-dialog/transaccion-dialog.component';
import { TransaccionService } from '../../services/transaccion.service';
import { HistorialPreciosService } from '../../services/historial-precios.service';
import { PortafolioService } from '../../services/portafolio.service';

Chart.register(...registerables);

@Component({
  selector: 'app-detalle-activo',
  templateUrl: './detalle-activo.component.html',
  styleUrls: ['./detalle-activo.component.css']
})
export class DetalleActivoComponent implements OnInit, OnDestroy, AfterViewInit {
  activoId!: number;
  activo$!: Observable<Activo>;
  usuario: Usuario | null = null;
  portafolioActual: Portafolio | null = null;
  cargando = true;
  error = false;
  actualizacionSubscription!: Subscription;
  activo: Activo | undefined;
  @ViewChild('preciosChart') private chartRef!: ElementRef;
  private chart: Chart | undefined;
  cantidadCompra: number = 0;
  montoCompra: number = 0;
  modoCantidad: boolean = true;
  maxCantidadPosible: number = 0;
  procesando: boolean = false;
  tipoTransaccion: 'compra' | 'venta' = 'compra';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activoService: ActivoService,
    private authService: AuthService,
    private transaccionService: TransaccionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private historialPreciosService: HistorialPreciosService,
    private portafolioService: PortafolioService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.activoId = +id;
        this.cargarActivo();
      } else {
        this.error = true;
        this.cargando = false;
      }
    });

    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
    });

    this.portafolioService.portafolioActual$.subscribe(portafolio => {
      this.portafolioActual = portafolio;
      this.actualizarMaxCantidadPosible();
    });
  }

  ngOnDestroy(): void {
    if (this.actualizacionSubscription) {
      this.actualizacionSubscription.unsubscribe();
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }

  ngAfterViewInit(): void {
    // Retraso la carga del historial para asegurar que el canvas esté disponible
    setTimeout(() => {
      if (this.activoId) {
        this.cargarHistorialPrecios();
      }
    }, 100);
  }

  private cargarHistorialPrecios(): void {
    console.log('Iniciando carga del historial de precios para el activo ID:', this.activoId);
    const fechaFin = new Date();
    const fechaInicio = new Date(fechaFin.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 días atrás

    this.historialPreciosService.obtenerHistorialPrecios(this.activoId, fechaInicio, fechaFin)
      .subscribe({
        next: (historial) => {
          console.log(`Historial de precios recibido: ${historial.length} registros`);
          if (historial.length === 0) {
            console.warn('El historial de precios está vacío');
            this.snackBar.open('No hay datos históricos disponibles para este activo', 'Cerrar', {
              duration: 3000
            });
            return;
          }
          
          // Verificar que el elemento canvas esté disponible antes de actualizar el gráfico
          if (!this.chartRef) {
            console.error('El elemento canvas no está disponible');
            setTimeout(() => this.actualizarGrafico(historial), 500); // Intentar de nuevo después de un retraso
            return;
          }
          
          this.actualizarGrafico(historial);
        },
        error: (error) => {
          console.error('Error al cargar el historial de precios:', error);
          this.snackBar.open('Error al cargar el historial de precios', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  private actualizarGrafico(historial: any[]): void {
    // Verificar si hay datos para mostrar
    if (!historial || historial.length === 0) {
      console.warn('No hay datos de historial para mostrar en el gráfico');
      return;
    }

    // Destruir el gráfico existente si hay uno
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }

    // Verificar que el elemento canvas esté disponible
    if (!this.chartRef) {
      console.error('El elemento canvas no está disponible');
      return;
    }

    try {
      const ctx = this.chartRef.nativeElement.getContext('2d');
      if (!ctx) {
        console.error('No se pudo obtener el contexto 2D del canvas');
        return;
      }

      // Asegurar que el canvas tenga dimensiones
      const canvas = this.chartRef.nativeElement;
      if (!canvas.style.height) {
        canvas.style.height = '300px';
      }
      if (!canvas.style.width) {
        canvas.style.width = '100%';
      }
      
      // Crear el gráfico con los datos del historial
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: historial.map(item => 
            new Date(item.fecha).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })
          ),
          datasets: [{
            label: 'Precio',
            data: historial.map(item => item.precio),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Evolución del Precio'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw as number;
                  return `Precio: ${this.formatearDinero(value)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: (value) => this.formatearDinero(value as number)
              }
            }
          }
        }
      });

      console.log('Gráfico de evolución de precios creado correctamente');
    } catch (error) {
      console.error('Error al crear el gráfico:', error);
    }
  }

  cargarActivo(): void {
    this.activo$ = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.activoService.obtenerActivoPorId(this.activoId))
    );

    this.actualizacionSubscription = this.activo$.subscribe({
      next: (activo) => {
        this.activo = activo;
        this.cargando = false;
        this.error = false;
      },
      error: (error) => {
        console.error('Error al cargar el activo:', error);
        this.cargando = false;
        this.error = true;

        const mensaje =
          error?.error?.error ||
          error?.message ||
          'Error desconocido';

        this.snackBar.open(`Error al cargar el activo: ${mensaje}`, 'Cerrar', {
          duration: 5000
        });
      }
    });
  }

  cambiarTipoTransaccion(tipo: 'compra' | 'venta'): void {
    this.tipoTransaccion = tipo;
    this.actualizarMaxCantidadPosible();
    // Resetear los valores del formulario al cambiar el tipo de transacción
    this.cantidadCompra = 0;
    this.montoCompra = 0;
  }

  cambiarModoCompra(esPorCantidad: boolean): void {
    this.modoCantidad = esPorCantidad;
    if (esPorCantidad) {
      this.calcularMontoTotal();
    } else {
      this.calcularCantidad();
    }
  }

  calcularMontoTotal(): void {
    if (this.activo?.precio && this.cantidadCompra) {
      this.montoCompra = this.cantidadCompra * this.activo.precio;
      this.actualizarMaxCantidadPosible();
    }
  }

  public actualizarMaxCantidadPosible(): void {
    if (!this.activo?.precio || !this.portafolioActual) {
      this.maxCantidadPosible = 0;
      return;
    }

    if (this.tipoTransaccion === 'compra') {
      // Para compras, la cantidad máxima depende del saldo disponible
      this.maxCantidadPosible = this.portafolioActual && this.activo?.precio ? Math.floor((this.portafolioActual?.saldo || 0) / this.activo.precio * 100000000) / 100000000 : 0;
    } else {
      // Para ventas, la cantidad máxima depende de cuántas unidades del activo tiene el usuario
      const activoEnPortafolio = this.portafolioActual.activos?.find(a => a.activoId === this.activo?.id);
      this.maxCantidadPosible = activoEnPortafolio?.cantidad || 0;
    }
  }

  calcularCantidad(): void {
    if (this.activo?.precio && this.montoCompra) {
      this.cantidadCompra = Math.floor(this.montoCompra / this.activo.precio * 100000000) / 100000000;
    }
  }

  realizarTransaccion(activoId: number, tipo: 'compra' | 'venta', cantidad: number): void {
    // Verificar que el ID del activo sea válido
    if (!activoId || activoId <= 0) {
      this.snackBar.open('Error: ID del activo no válido', 'Cerrar', { duration: 3000 });
      return;
    }

    // Verificar que el activo actual coincida con el ID proporcionado
    if (this.activo && this.activo.id !== activoId) {
      console.warn(`ID de activo en transacción (${activoId}) no coincide con activo actual (${this.activo.id})`);
      // Usar el ID del activo actual para asegurar consistencia
      activoId = this.activo.id;
    }

    if (!this.activo?.precio) {
      this.snackBar.open('Error: Precio del activo no disponible', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.portafolioActual) {
      this.snackBar.open('Error: No hay un portafolio seleccionado', 'Cerrar', { duration: 3000 });
      return;
    }

    if (tipo === 'compra') {
      const montoTotal = cantidad * this.activo.precio;
      if (montoTotal > (this.portafolioActual?.saldo || 0)) {
        this.snackBar.open('Error: Saldo insuficiente en el portafolio', 'Cerrar', { duration: 3000 });
        return;
      }
    } else if (tipo === 'venta') {
      // Verificar si el usuario tiene suficientes unidades del activo para vender
      const activoEnPortafolio = this.portafolioActual.activos?.find(a => a.activoId === activoId);
      const cantidadDisponible = activoEnPortafolio?.cantidad || 0;
      
      if (cantidad > cantidadDisponible) {
        this.snackBar.open('Error: No tienes suficientes activos para vender', 'Cerrar', { duration: 3000 });
        return;
      }
    }

    this.procesando = true;
    console.log(`Enviando transacción: Activo ID=${activoId}, Tipo=${tipo}, Cantidad=${cantidad}`);
    
    // Pasar el ID del portafolio seleccionado al servicio de transacciones
    const portafolioId = this.portafolioActual?.id;
    this.transaccionService.crearTransaccion(activoId, tipo, cantidad, portafolioId)
      .subscribe({
        next: () => {
          this.procesando = false;
          this.snackBar.open(
            `Transacción de ${tipo} realizada con éxito`,
            'Cerrar',
            { duration: 3000 }
          );
          this.authService.verificarSesion();
          // Limpiar el formulario después de una transacción exitosa
          this.cantidadCompra = 0;
          this.montoCompra = 0;
        },
        error: (error) => {
          this.procesando = false;
          this.snackBar.open(
            `Error al realizar la transacción: ${error.error?.error || 'Error desconocido'}`,
            'Cerrar',
            { duration: 5000 }
          );
          console.error('Error en transacción:', error);
        }
      });
  }

  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor);
  }

  obtenerClaseVariacion(variacion: number): string {
    if (variacion > 0) return 'variacion-positiva';
    if (variacion < 0) return 'variacion-negativa';
    return 'variacion-neutral';
  }

  obtenerIconoTendencia(tendencia: string | undefined): string {
    switch (tendencia) {
      case 'alza': return 'trending_up';
      case 'baja': return 'trending_down';
      default: return 'trending_flat';
    }
  }
}
