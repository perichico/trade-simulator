import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActivoService } from '../../services/activo.service';
import { HistorialPreciosService, HistorialPrecio } from '../../services/historial-precios.service';
import { Activo } from '../../models/activo.model';
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

  constructor(
    private route: ActivatedRoute,
    private activoService: ActivoService,
    private historialPreciosService: HistorialPreciosService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.cargarActivo(id);
      this.cargarHistorialPrecios(id);
    });
  }

  cargarActivo(id: number): void {
    this.activoService.obtenerActivoPorId(id).subscribe({
      next: (activo) => {
        this.activo = activo;
      },
      error: (error) => {
        console.error('Error al cargar el activo:', error);
      }
    });
  }

  cargarHistorialPrecios(activoId: number): void {
    this.historialPreciosService.obtenerHistorialPrecios(activoId, this.periodoSeleccionado)
      .subscribe({
        next: (historial) => {
          this.historialPrecios = historial;
          console.log('Historial de precios cargado:', historial.length, 'registros');
          this.actualizarGrafico();
        },
        error: (error) => {
          console.error('Error al cargar historial de precios:', error);
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

  comprarActivo(): void {
    console.log('Comprar activo:', this.activo);
  }

  venderActivo(): void {
    console.log('Vender activo:', this.activo);
  }

  crearAlerta(): void {
    console.log('Crear alerta para:', this.activo);
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
