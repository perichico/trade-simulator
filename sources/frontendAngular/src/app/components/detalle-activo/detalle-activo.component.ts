import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivoService } from '../../services/activo.service';
import { HistorialPreciosService, HistorialPrecio } from '../../services/historial-precios.service';
import { TransaccionService } from '../../services/transaccion.service';
import { AuthService } from '../../services/auth.service';
import { PortafolioService } from '../../services/portafolio.service';
import { Activo } from '../../models/activo.model';
import { Usuario } from '../../models/usuario.model';
import { Portafolio } from '../../models/portafolio.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-detalle-activo',
  templateUrl: './detalle-activo.component.html',
  styleUrls: ['./detalle-activo.component.scss']
})
export class DetalleActivoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('priceChart') private chartRef!: ElementRef;
  private chart: Chart | undefined;

  activo: Activo | null = null;
  historialPrecios: HistorialPrecio[] = [];
  transacciones: any[] = [];
  periodoSeleccionado: number = 30; // Días por defecto
  
  // Nuevas propiedades para el usuario y portafolio
  usuario: Usuario | null = null;
  portafolioActual: Portafolio | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activoService: ActivoService,
    private historialPreciosService: HistorialPreciosService,
    private transaccionService: TransaccionService,
    private authService: AuthService,
    private portafolioService: PortafolioService
  ) { }

  ngOnInit(): void {
    // Obtener usuario actual
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
      // Cargar transacciones cuando el usuario esté disponible
      if (usuario && this.activo) {
        this.cargarTransacciones(this.activo.id);
      }
    });

    // Obtener portafolio actual
    this.portafolioService.portafolioActual$.subscribe(portafolio => {
      this.portafolioActual = portafolio;
    });

    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.cargarActivo(id);
      this.cargarHistorialPrecios(id);
      // Cargar transacciones si el usuario ya está disponible
      if (this.usuario) {
        this.cargarTransacciones(id);
      }
    });
  }

  cargarActivo(id: number): void {
    // Validar que el ID sea un número válido
    if (!id || isNaN(id) || id <= 0) {
      console.error('ID de activo inválido:', id);
      this.router.navigate(['/mercado']);
      return;
    }
    
    this.activoService.obtenerActivoPorId(id).subscribe({
      next: (activo) => {
        // Verificar que el activo recibido tenga el ID correcto
        if (activo.id !== id) {
          console.error(`Error: ID solicitado (${id}) no coincide con ID recibido (${activo.id})`);
          this.router.navigate(['/mercado']);
          return;
        }
        
        this.activo = activo;
        console.log('Activo cargado correctamente:', activo);
        
        // Cargar transacciones cuando el activo esté cargado
        if (this.usuario) {
          this.cargarTransacciones(id);
        }
      },
      error: (error) => {
        console.error('Error al cargar el activo:', error);
        // En lugar de mostrar un activo genérico, navegar de vuelta al mercado
        this.mostrarNotificacion('No se pudo cargar la información del activo', 'error');
        this.router.navigate(['/mercado']);
      }
    });
  }

  cargarHistorialPrecios(activoId: number): void {
    // Calcular fecha de inicio basada en el período seleccionado
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - this.periodoSeleccionado);
    
    this.historialPreciosService.obtenerHistorialPrecios(activoId, fechaInicio, fechaFin)
      .subscribe({
        next: (historial) => {
          this.historialPrecios = historial;
          console.log('Historial de precios cargado:', historial.length, 'registros');
          console.log('Período:', this.periodoSeleccionado, 'días');
          console.log('Fecha inicio:', fechaInicio.toISOString());
          console.log('Fecha fin:', fechaFin.toISOString());
          this.actualizarGrafico();
        },
        error: (error) => {
          console.error('Error al cargar historial de precios:', error);
        }
      });
  }

  cargarTransacciones(activoId: number): void {
    if (!this.usuario) {
      this.transacciones = [];
      console.log('No hay usuario logueado, no se cargan transacciones');
      return;
    }

    console.log('Cargando transacciones para activo:', activoId);
    
    // Intentar obtener transacciones específicas del activo
    this.transaccionService.obtenerTransaccionesPorActivo(activoId).subscribe({
      next: (transacciones) => {
        this.transacciones = transacciones || [];
        console.log('Transacciones cargadas para activo', activoId, ':', transacciones);
        
        if (this.transacciones.length === 0) {
          console.log('No hay transacciones para este activo');
        }
      },
      error: (error) => {
        console.error('Error al cargar transacciones por activo:', error);
        
        // Si falla, intentar obtener todas las transacciones y filtrar
        this.transaccionService.obtenerTransaccionesUsuario().subscribe({
          next: (todasTransacciones) => {
            this.transacciones = todasTransacciones.filter(t => 
              (t.activoId === activoId || t.activo_id === activoId)
            ) || [];
            console.log('Transacciones filtradas para activo', activoId, ':', this.transacciones);
          },
          error: (error2) => {
            console.error('Error al cargar todas las transacciones:', error2);
            this.transacciones = [];
          }
        });
      }
    });
  }

  cambiarPeriodo(dias: number): void {
    this.periodoSeleccionado = dias;
    if (this.activo) {
      this.cargarHistorialPrecios(this.activo.id);
    }
  }

  actualizarGrafico(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    let canvasElement = this.chartRef?.nativeElement;
    if (!canvasElement) {
      canvasElement = document.getElementById('priceChart');
    }

    if (!canvasElement || this.historialPrecios.length === 0) {
      console.error('No se encontró el elemento canvas o no hay datos');
      return;
    }

    const ctx = canvasElement.getContext('2d');
    
    const fechas = this.historialPrecios.map(item => 
      new Date(item.fecha).toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short'
      })
    );

    const precios = this.historialPrecios.map(item => item.precio);
    
    // Determinar color del gráfico basado en la tendencia
    const primerPrecio = precios[0];
    const ultimoPrecio = precios[precios.length - 1];
    const tendenciaPositiva = ultimoPrecio > primerPrecio;

    try {
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: fechas,
          datasets: [{
            label: `Precio de ${this.activo?.simbolo || 'Activo'}`,
            data: precios,
            borderColor: tendenciaPositiva ? 'rgb(76, 175, 80)' : 'rgb(244, 67, 54)',
            backgroundColor: tendenciaPositiva 
              ? 'rgba(76, 175, 80, 0.1)' 
              : 'rgba(244, 67, 54, 0.1)',
            borderWidth: 2,
            tension: 0.2,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: tendenciaPositiva ? 'rgb(76, 175, 80)' : 'rgb(244, 67, 54)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            title: {
              display: true,
              text: `Evolución del precio - ${this.periodoSeleccionado} días`,
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw as number;
                  return `Precio: $${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
              }
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: (value) => `$${(value as number).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
      console.log('Gráfico de precios creado correctamente');
    } catch (error) {
      console.error('Error al crear el gráfico de precios:', error);
    }
  }

  cambiarPeriodoGrafico(nuevoPeriodo: number): void {
    this.periodoSeleccionado = nuevoPeriodo;
    if (this.activo) {
      this.cargarHistorialPrecios(this.activo.id);
    }
  }

  getTendenciaClass(variacion: number): string {
    if (variacion > 0) return 'positivo';
    if (variacion < 0) return 'negativo';
    return 'neutro';
  }

  getIconoTendencia(variacion: number): string {
    if (variacion > 0) return 'bi-arrow-up';
    if (variacion < 0) return 'bi-arrow-down';
    return 'bi-dash';
  }

  getTendenciaTexto(variacion: number): string {
    if (variacion > 0) return 'Al alza';
    if (variacion < 0) return 'A la baja';
    return 'Estable';
  }

  getVolatilidadPorcentaje(variacion: number): number {
    return Math.min(Math.abs(variacion) * 10, 100);
  }

  getColorVolatilidad(variacion: number): 'primary' | 'accent' | 'warn' {
    const abs = Math.abs(variacion);
    if (abs < 2) return 'primary';
    if (abs < 5) return 'accent';
    return 'warn';
  }

  // Reemplaza el método que muestra el pop-up con navegación
  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info' = 'success'): void {
    // Usar alert por simplicidad hasta crear el componente de notificación
    alert(mensaje);
  }

  comprarActivo(): void {
    if (!this.activo || !this.usuario) {
      return;
    }
    
    this.router.navigate(['/transaccion'], {
      queryParams: {
        activoId: this.activo.id,
        tipo: 'compra'
      }
    });
  }

  venderActivo(): void {
    if (!this.activo || !this.usuario) {
      return;
    }
    
    this.router.navigate(['/transaccion'], {
      queryParams: {
        activoId: this.activo.id,
        tipo: 'venta'
      }
    });
  }

  crearAlerta(): void {
    if (!this.activo || !this.usuario) {
      return;
    }
    
    // Navegar al componente de alertas con parámetros
    this.router.navigate(['/alertas'], {
      queryParams: {
        activoId: this.activo.id,
        simbolo: this.activo.simbolo,
        precioActual: this.activo.ultimo_precio || this.activo.precio
      }
    });
  }

  // Método para realizar la transacción
  private realizarTransaccion(activoId: number, tipo: 'compra' | 'venta', cantidad: number): void {
    const portafolioId = this.portafolioActual?.id;
    
    this.transaccionService.crearTransaccion(activoId, tipo, cantidad, portafolioId)
      .subscribe({
        next: (respuesta) => {
          this.mostrarNotificacion(`Transacción de ${tipo} realizada con éxito`, 'success');
          
          // Actualizar el balance del usuario y el portafolio
          this.authService.verificarSesion();
          
          // Recargar información del portafolio actual
          if (this.portafolioActual?.id) {
            this.portafolioService.seleccionarPortafolio(this.portafolioActual.id).subscribe();
          }
        },
        error: (error) => {
          this.mostrarNotificacion(
            `Error al realizar la transacción: ${error.error?.error || 'Error desconocido'}`, 
            'error'
          );
        }
      });
  }

  // Método helper para obtener el activo en el portafolio actual
  getActivoEnPortafolio() {
    if (!this.portafolioActual?.activos || !this.activo) {
      return null;
    }
    return this.portafolioActual.activos.find(a => a.activoId === this.activo!.id);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.historialPrecios.length > 0) {
        this.actualizarGrafico();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
