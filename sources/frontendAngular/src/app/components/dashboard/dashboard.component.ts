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
import * as bootstrap from 'bootstrap';

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
  portafolios: Portafolio[] = [];
  portafolioSeleccionado: Portafolio | null = null;
  actualizacionSubscription!: Subscription;
  now: Date = new Date();
  historialPatrimonio: PatrimonioHistorico[] = [];
  
  // Variables para el formulario de nuevo portafolio
  nuevoPortafolioNombre: string = '';
  
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
        
        // Inicializar el modal de Bootstrap
        const modalElement = document.getElementById('nuevoPortafolioModal');
        if (modalElement) {
          new bootstrap.Modal(modalElement);
        }
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

  // Método para cargar todos los portafolios del usuario
  cargarPortafolio(usuarioId: number): void {
    // Primero cargamos la lista de portafolios
    this.portafolioService.obtenerPortafolios(usuarioId).subscribe(portafolios => {
      this.portafolios = portafolios;
      
      // Si no hay portafolios, creamos uno por defecto
      if (portafolios.length === 0) {
        this.crearPortafolioPorDefecto(usuarioId);
      } else {
        // Seleccionamos el primer portafolio o el último seleccionado
        const portafolioIdGuardado = localStorage.getItem(`usuario_${usuarioId}_portafolio`);
        const portafolioId = portafolioIdGuardado ? parseInt(portafolioIdGuardado) : portafolios[0].id;
        
        if (portafolioId) {
          this.seleccionarPortafolio(portafolioId);
        } else {
          this.seleccionarPortafolio(portafolios[0].id!);
        }
      }
    });
  }
  
  // Método para crear un portafolio por defecto si el usuario no tiene ninguno
  crearPortafolioPorDefecto(usuarioId: number): void {
    this.portafolioService.crearPortafolio(usuarioId, 'Portafolio Principal')
      .subscribe(portafolio => {
        this.portafolios = [portafolio];
        this.seleccionarPortafolio(portafolio.id!);
      });
  }
  
  // Método para seleccionar un portafolio específico
  seleccionarPortafolio(portafolioId: number): void {
    if (!this.usuario) return;
    
    // Guardar la selección en localStorage
    localStorage.setItem(`usuario_${this.usuario.id}_portafolio`, portafolioId.toString());
    
    // Actualizar el portafolio seleccionado
    this.portafolio$ = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.portafolioService.obtenerPortafolioPorId(portafolioId))
    );
    
    // Suscribirse al portafolio actual
    this.portafolioService.seleccionarPortafolio(portafolioId).subscribe(portafolio => {
      this.portafolioSeleccionado = portafolio;
    });
  }
  
  // Método para crear un nuevo portafolio
  crearNuevoPortafolio(nombre: string): void {
    if (!this.usuario) return;
    
    this.portafolioService.crearPortafolio(this.usuario.id, nombre)
      .subscribe(nuevoPortafolio => {
        // Añadimos el nuevo portafolio a la lista sin modificar sus propiedades
        // El servicio ya se encarga de inicializar correctamente los valores
        this.portafolios.push(nuevoPortafolio);
        this.seleccionarPortafolio(nuevoPortafolio.id!);
        this.snackBar.open(`Portafolio "${nombre}" creado con éxito con un saldo inicial de 10.000€`, 'Cerrar', {
          duration: 3000
        });
        // Limpiar el formulario después de crear el portafolio
        this.resetearFormularioPortafolio();
      });
  }
  
  // Método para resetear el formulario de nuevo portafolio
  resetearFormularioPortafolio(): void {
    this.nuevoPortafolioNombre = '';
  }

  // Método para cerrar sesión
  cerrarSesion(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  // Método para convertir ActivoEnPortafolio a Activo
  private convertirAActivo(activoPortafolio: any): Activo {
    if (!activoPortafolio || !activoPortafolio.activoId) {
      console.warn('Intento de convertir un activo inválido:', activoPortafolio);
      // Crear un activo con valores predeterminados para evitar errores
      return {
        id: 0,
        nombre: 'Activo inválido',
        simbolo: 'N/A',
        ultimo_precio: 0,
        tipo: 'accion'
      };
    }
    
    return {
      id: activoPortafolio.activoId,
      nombre: activoPortafolio.nombre || 'Activo sin nombre',
      simbolo: activoPortafolio.simbolo || 'N/A',
      ultimo_precio: activoPortafolio.precioActual || 0,
      tipo: activoPortafolio.tipo || 'accion'
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

    // Validar que el activo tenga un ID válido
    if (!activoPortafolio || !activoPortafolio.activoId) {
      this.snackBar.open('Símbolo o ID de activo no proporcionado', 'Cerrar', {
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