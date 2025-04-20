import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { Usuario } from '../../models/usuario.model';
import { Portafolio } from '../../models/portafolio.model';
import { Activo } from '../../models/activo.model';
import { TransaccionDialogComponent } from '../transaccion-dialog/transaccion-dialog.component';
import { TransaccionService } from '../../services/transaccion.service';
import { AuthService } from '../../services/auth.service';
import { PortafolioService } from '../../services/portafolio.service';
import { PatrimonioService, PatrimonioHistorico } from '../../services/patrimonio.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('patrimonioChart') private chartRef!: ElementRef;
  private chart: Chart | undefined;

  usuario: Usuario | null = null;
  portafolio$: Observable<Portafolio> | null = null;
  actualizacionSubscription!: Subscription;
  now: Date = new Date();
  historialPatrimonio: PatrimonioHistorico[] = [];
  
  constructor(
    private authService: AuthService,
    private portafolioService: PortafolioService,
    private transaccionService: TransaccionService,
    private patrimonioService: PatrimonioService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Suscribirse al usuario actual
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
      
      // Si hay un usuario autenticado, cargar su portafolio y historial
      if (usuario) {
        this.cargarPortafolio(usuario.id);
        this.cargarHistorialPatrimonio(usuario.id);
      } else {
        this.router.navigate(['/login']);
      }
    });

    // Actualizar la hora cada minuto
    setInterval(() => {
      this.now = new Date();
    }, 60000);
  }

  // Método para formatear valores monetarios
  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor);
  }

  // Método para determinar la clase CSS según el valor (positivo/negativo)
  obtenerClaseValor(valor: number): string {
    return valor >= 0 ? 'positive-value' : 'negative-value';
  }

  // Método para cargar y actualizar el portafolio
  cargarPortafolio(usuarioId: number): void {
    this.portafolio$ = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.portafolioService.obtenerPortafolio(usuarioId))
    );
  }

  // Método para cerrar sesión
  cerrarSesion(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  // Método para convertir ActivoEnPortafolio a Activo
  private convertirAActivo(activoPortafolio: any): Activo {
    return {
      id: activoPortafolio.activoId,
      nombre: activoPortafolio.nombre,
      simbolo: activoPortafolio.simbolo,
      ultimo_precio: activoPortafolio.precioActual,
      tipo: activoPortafolio.tipo
    };
  }

  // Método para abrir el diálogo de transacción
  abrirDialogoTransaccion(activoPortafolio: any, tipo: 'compra' | 'venta'): void {
    if (!this.usuario) {
      this.snackBar.open('Debes iniciar sesión para realizar transacciones', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    const activo = this.convertirAActivo(activoPortafolio);
    if (tipo === 'compra') {
      this.router.navigate(['/detalle-activo', activo.id]);
      return;
    }
    // Para venta, mantener el diálogo actual
    const dialogRef = this.dialog.open(TransaccionDialogComponent, {
      width: '400px',
      data: {
        activo,
        tipo,
        balanceUsuario: this.usuario.balance
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.realizarTransaccion(activo.id, tipo, result.cantidad);
      }
    });
  }

  // Método para realizar la transacción
  realizarTransaccion(activoId: number, tipo: 'compra' | 'venta', cantidad: number): void {
    this.transaccionService.crearTransaccion(activoId, tipo, cantidad)
      .subscribe({
        next: (respuesta) => {
          this.snackBar.open(
            `Transacción de ${tipo} realizada con éxito`, 
            'Cerrar', 
            { duration: 3000 }
          );
          
          // Actualizar el balance del usuario y el portafolio
          this.authService.verificarSesion();
          if (this.usuario) {
            this.cargarPortafolio(this.usuario.id);
          }
        },
        error: (error) => {
          this.snackBar.open(
            `Error al realizar la transacción: ${error.error?.error || 'Error desconocido'}`, 
            'Cerrar', 
            { duration: 5000 }
          );
        }
      });
  }

  cargarHistorialPatrimonio(usuarioId: number): void {
    this.patrimonioService.obtenerHistorialPatrimonio(usuarioId)
      .subscribe(historial => {
        this.historialPatrimonio = historial;
        this.actualizarGrafico();
      });
  }

  actualizarGrafico(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    if (this.chartRef && this.historialPatrimonio.length > 0) {
      const ctx = this.chartRef.nativeElement.getContext('2d');
      
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.historialPatrimonio.map(item => 
            new Date(item.fecha).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short'
            })
          ),
          datasets: [{
            label: 'Patrimonio Total',
            data: this.historialPatrimonio.map(item => item.patrimonioTotal),
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
              text: 'Evolución del Patrimonio'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw as number;
                  return `Patrimonio: ${this.formatearDinero(value)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => this.formatearDinero(value as number)
              }
            }
          }
        }
      });
    }
  }

  ngAfterViewInit(): void {
    if (this.historialPatrimonio.length > 0) {
      this.actualizarGrafico();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    if (this.actualizacionSubscription) {
      this.actualizacionSubscription.unsubscribe();
    }
  }
}