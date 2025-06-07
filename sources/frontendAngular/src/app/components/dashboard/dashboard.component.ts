import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as bootstrap from 'bootstrap';
import { Observable, Subscription, interval } from 'rxjs';
import { startWith, switchMap, tap } from 'rxjs/operators';
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
  portafolios: Portafolio[] = [];
  portafolioSeleccionado: Portafolio | null = null;
  actualizacionSubscription!: Subscription;
  now: Date = new Date();
  historialPatrimonio: PatrimonioHistorico[] = [];
  
  // Variables para el formulario de nuevo portafolio
  nuevoPortafolioNombre: string = '';
  
  // Variable para el modal de eliminación de portafolio
  portafolioAEliminar: number | null = null;
  
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
          const modal = new bootstrap.Modal(modalElement as HTMLElement);
        }
      } else {
        this.router.navigate(['/login']);
      }
    });

    // Actualizar la hora cada minuto
    setInterval(() => {
      this.now = new Date();
    }, 60000);

    // Crear un observer para comprobar cuando el chartRef esté disponible
    const observer = new MutationObserver((mutations, obs) => {
      const chartElement = document.getElementById('patrimonioChart');
      if (chartElement) {
        console.log('Elemento canvas encontrado en el DOM');
        if (this.historialPatrimonio.length > 0) {
          this.actualizarGrafico();
        }
        obs.disconnect(); // Dejar de observar una vez encontrado
      }
    });
    
    // Comenzar a observar el documento con la configuración indicada
    observer.observe(document, {
      childList: true,
      subtree: true
    });
  }

  // Método para formatear valores monetarios
  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(valor || 0);
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
    
    console.log('Seleccionando portafolio:', portafolioId);
    
    // Guardar la selección en localStorage
    localStorage.setItem(`usuario_${this.usuario.id}_portafolio`, portafolioId.toString());
    
    // Cancelar suscripciones anteriores para evitar fugas de memoria
    if (this.actualizacionSubscription) {
      this.actualizacionSubscription.unsubscribe();
    }
    
    // Actualizar el portafolio seleccionado
    this.portafolio$ = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.portafolioService.obtenerPortafolioPorId(portafolioId)),
      tap(portafolio => {
        console.log('Portafolio recibido en componente:', portafolio);
      })
    );
    
    // Suscribirse al portafolio actual
    this.actualizacionSubscription = this.portafolioService.seleccionarPortafolio(portafolioId).subscribe(portafolio => {
      this.portafolioSeleccionado = portafolio;
      console.log('Portafolio seleccionado actualizado:', portafolio);
      
      // Actualizar el historial de patrimonio al cambiar de portafolio
      if (this.usuario) {
        this.cargarHistorialPatrimonio(this.usuario.id, portafolioId);
      }
    });
  }
  
  // Método para seleccionar un portafolio a eliminar en el modal
  seleccionarPortafolioAEliminar(portafolioId: number): void {
    this.portafolioAEliminar = portafolioId;
  }
  
  // Método para confirmar la eliminación del portafolio seleccionado
  confirmarEliminarPortafolio(): void {
    if (!this.usuario || !this.portafolioAEliminar) return;
    
    // Evitar eliminar el último portafolio
    if (this.portafolios.length <= 1) {
      this.snackBar.open('No puedes eliminar el único portafolio disponible', 'Cerrar', {
        duration: 3000
      });
      return;
    }
    
    // Guardar el ID del portafolio a eliminar en una variable local
    const portafolioId = this.portafolioAEliminar;
    
    this.portafolioService.eliminarPortafolio(portafolioId).subscribe({
      next: () => {
        // Cerrar el modal de eliminación usando Bootstrap
        const modalElement = document.getElementById('eliminarPortafolioModal');
        if (modalElement) {
          const modalInstance = bootstrap.Modal.getInstance(modalElement);
          if (modalInstance) {
            modalInstance.hide();
            // Eliminar el backdrop manualmente
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
              backdrop.remove();
            }
            // Restaurar el scroll y eliminar la clase modal-open del body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
          }
        }

        // Eliminar el portafolio de la lista local
        this.portafolios = this.portafolios.filter(p => p.id !== portafolioId);
        
        // Si el portafolio eliminado era el seleccionado, seleccionar otro
        if (this.portafolioSeleccionado?.id === portafolioId) {
          this.seleccionarPortafolio(this.portafolios[0].id!);
        }

        // Mostrar mensaje de éxito
        this.snackBar.open('Portafolio eliminado con éxito', 'Cerrar', {
          duration: 3000
        });

        // Resetear la variable de portafolio a eliminar
        this.portafolioAEliminar = null;
      },
      error: (error) => {
        console.error('Error al eliminar el portafolio:', error);
        this.snackBar.open(
          `Error al eliminar el portafolio: ${error.error?.message || error.error?.error || 'Error desconocido'}`,
          'Cerrar',
          { duration: 5000 }
        );
        // Resetear la variable de portafolio a eliminar en caso de error
        this.portafolioAEliminar = null;
      }
    });
  }
  
  // Método para eliminar un portafolio (mantener para compatibilidad)
  eliminarPortafolio(portafolioId: number): void {
    this.portafolioAEliminar = portafolioId;
    this.confirmarEliminarPortafolio();
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
    this.portafolioAEliminar = null;
  }

  // Método para cerrar sesión
  cerrarSesion(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  // Método para convertir ActivoEnPortafolio a Activo
  private convertirAActivo(activoPortafolio: any): Activo {
    if (!activoPortafolio) {
      console.warn('Intento de convertir un activo inválido:', activoPortafolio);
      // Crear un activo con valores predeterminados para evitar errores
      return {
        id: 0,
        nombre: 'Activo inválido',
        simbolo: 'N/A',
        ultimo_precio: 0,
        ultima_actualizacion: new Date(),
        tipo: 'accion',
        tipoActivo: { id: 1, nombre: 'Acción' },
        variacion: 0
      };
    }
    
    // Normalizar el ID del activo
    const activoId = activoPortafolio.activoId || activoPortafolio.id || activoPortafolio.activo_id;
    
    if (!activoId) {
      console.warn('Activo sin ID válido:', activoPortafolio);
      return {
        id: 0,
        nombre: 'Activo sin ID',
        simbolo: 'N/A',
        ultimo_precio: 0,
        ultima_actualizacion: new Date(),
        tipo: 'accion',
        tipoActivo: { id: 1, nombre: 'Acción' },
        variacion: 0
      };
    }
    
    return {
      id: activoId,
      nombre: activoPortafolio.nombre || 'Activo sin nombre',
      simbolo: activoPortafolio.simbolo || 'N/A',
      ultimo_precio: activoPortafolio.precioActual || 0,
      ultima_actualizacion: activoPortafolio.ultima_actualizacion ? new Date(activoPortafolio.ultima_actualizacion) : new Date(),
      tipo: activoPortafolio.tipo || 'accion',
      tipoActivo: activoPortafolio.tipoActivo || { id: 1, nombre: 'Acción' },
      variacion: activoPortafolio.variacion || 0
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
        balanceUsuario: this.portafolioSeleccionado?.saldo || 0
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
    // Pasar el ID del portafolio seleccionado al servicio de transacciones
    const portafolioId = this.portafolioSeleccionado?.id;
    this.transaccionService.crearTransaccion(activoId, tipo, cantidad, portafolioId)
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

  // Modificar este método para mejorar el manejo del cambio de portafolio
  cargarHistorialPatrimonio(usuarioId: number, portafolioId?: number): void {
    if (!portafolioId) {
      portafolioId = this.portafolioSeleccionado?.id;
    }
    console.log(`Cargando historial de patrimonio para usuario ${usuarioId}, portafolio actual: ${portafolioId}`);
    
    // Pasar el portafolioId al servicio si está disponible
    this.patrimonioService.obtenerHistorialPatrimonio(usuarioId, portafolioId)
      .subscribe({
        next: (historial) => {
          this.historialPatrimonio = historial;
          console.log(`Historial patrimonio cargado: ${historial.length} registros`);
          
          if (historial.length === 0) {
            console.warn('No hay datos de historial de patrimonio para el usuario');
            // Crear datos de muestra para probar la visualización del gráfico
            this.crearDatosDeMuestraParaGrafico(usuarioId);
          }
          
          // Actualizar el gráfico inmediatamente
          this.actualizarGrafico();
        },
        error: (error) => {
          console.error('Error al cargar historial de patrimonio:', error);
          // Crear datos de muestra en caso de error
          this.crearDatosDeMuestraParaGrafico(usuarioId);
          // Intentar actualizar el gráfico incluso en caso de error
          this.actualizarGrafico();
        }
      });
  }

  // Método para crear datos de muestra mientras se resuelve el problema del endpoint
  crearDatosDeMuestraParaGrafico(usuarioId: number): void {
    if (this.portafolioSeleccionado) {
      this.crearDatosSimuladosBasadosEnPortafolio(this.portafolioSeleccionado);
    } else {
      console.log('Creando datos de muestra genéricos para el gráfico');
      const hoy = new Date();
      const datosMuestra: PatrimonioHistorico[] = [];
      
      // Generar datos de muestra para los últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(hoy.getDate() - i);
        
        // Valor base más una variación aleatoria
        const balanceBase = 5000 + Math.random() * 2000;
        const valorPortafolioBase = 4000 + Math.random() * 3000;
        const patrimonioTotalBase = balanceBase + valorPortafolioBase;
        const rendimientoTotalBase = patrimonioTotalBase - 10000; // Saldo inicial de referencia
        
        datosMuestra.push({
          usuarioId: usuarioId,
          fecha: fecha.toISOString(),
          balance: balanceBase,
          valorPortafolio: valorPortafolioBase,
          patrimonioTotal: patrimonioTotalBase,
          rendimientoTotal: rendimientoTotalBase
        });
      }
      
      this.historialPatrimonio = datosMuestra;
    }
  }
  
  // Método para crear datos simulados basados en el portafolio actual
  crearDatosSimuladosBasadosEnPortafolio(portafolio: Portafolio): void {
    console.log('Creando datos simulados basados en el portafolio actual');
    const hoy = new Date();
    const datosMuestra: PatrimonioHistorico[] = [];
    
    // Usar valores reales calculados del portafolio
    const saldoActual = portafolio.saldo || 10000;
    const valorPortafolioActual = this.obtenerValorTotalPortafolio();
    
    // Generar datos de muestra para los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(hoy.getDate() - i);
      
      // Factor de variación que aumenta mientras más días hacia atrás
      const factorVariacion = 1 - (i * 0.03); // 3% de variación por día
      
      // Calcular valores con variación
      const balanceDia = saldoActual * factorVariacion * (0.95 + Math.random() * 0.1);
      const valorPortafolioDia = valorPortafolioActual * factorVariacion * (0.95 + Math.random() * 0.1);
      const patrimonioTotalDia = balanceDia + valorPortafolioDia;
      const rendimientoTotalDia = patrimonioTotalDia - 10000; // Saldo inicial de referencia
      
      datosMuestra.push({
        usuarioId: portafolio.usuarioId || 0,
        fecha: fecha.toISOString(),
        balance: Math.round(balanceDia * 100) / 100,
        valorPortafolio: Math.round(valorPortafolioDia * 100) / 100,
        patrimonioTotal: Math.round(patrimonioTotalDia * 100) / 100,
        rendimientoTotal: Math.round(rendimientoTotalDia * 100) / 100
      });
    }
    
    this.historialPatrimonio = datosMuestra;
  }

  // Método para calcular el rendimiento porcentual del portafolio seleccionado
  calcularRendimientoPorcentual(): number {
    if (!this.portafolioSeleccionado) {
      return 0;
    }

    // Saldo inicial de referencia en EUR
    const saldoInicial = 10000;
    
    // Calcular patrimonio total actual (saldo + valor de activos)
    const saldoActual = this.portafolioSeleccionado.saldo || 0;
    const valorActivos = this.obtenerValorTotalPortafolio();
    const patrimonioTotal = saldoActual + valorActivos;
    
    // Calcular rendimiento en euros: patrimonio total - saldo inicial
    const rendimientoEuros = patrimonioTotal - saldoInicial;
    
    // Calcular rendimiento porcentual basado en el saldo inicial
    const rendimientoPorcentual = (rendimientoEuros / saldoInicial) * 100;
    
    console.log('Cálculo de rendimiento porcentual:', {
      saldoInicial,
      saldoActual,
      valorActivos,
      patrimonioTotal,
      rendimientoEuros,
      rendimientoPorcentual
    });
    
    return Math.round(rendimientoPorcentual * 100) / 100;
  }

  // Método para obtener el valor total actualizado del portafolio
  obtenerValorTotalPortafolio(): number {
    if (!this.portafolioSeleccionado || !this.portafolioSeleccionado.activos) {
      return 0;
    }

    const valorTotal = this.portafolioSeleccionado.activos.reduce((total, activo) => {
      return total + (activo.valorTotal || 0);
    }, 0);
    
    console.log('Valor total del portafolio:', valorTotal);
    return valorTotal;
  }

  // Método para obtener el rendimiento total del portafolio en euros
  obtenerRendimientoTotal(): number {
    if (!this.portafolioSeleccionado) {
      return 0;
    }

    // Saldo inicial de referencia
    const saldoInicial = 10000;
    
    // Calcular patrimonio total actual
    const saldoActual = this.portafolioSeleccionado.saldo || 0;
    const valorActivos = this.obtenerValorTotalPortafolio();
    const patrimonioTotal = saldoActual + valorActivos;
    
    // Rendimiento total = patrimonio total - saldo inicial
    const rendimientoTotal = patrimonioTotal - saldoInicial;
    
    console.log('Rendimiento total del portafolio:', rendimientoTotal);
    return rendimientoTotal;
  }

  // Método helper para validar datos del portafolio
  validarDatosPortafolio(): boolean {
    if (!this.portafolioSeleccionado) {
      console.warn('No hay portafolio seleccionado');
      return false;
    }

    if (!this.portafolioSeleccionado.activos || this.portafolioSeleccionado.activos.length === 0) {
      console.log('Portafolio sin activos');
      return true; // Es válido tener un portafolio vacío
    }

    // Validar que los activos tienen datos consistentes
    const activosInvalidos = this.portafolioSeleccionado.activos.filter(activo => 
      !activo.activoId || 
      typeof activo.cantidad !== 'number' ||
      typeof activo.precioCompra !== 'number' ||
      typeof activo.precioActual !== 'number'
    );

    if (activosInvalidos.length > 0) {
      console.warn('Activos con datos inválidos encontrados:', activosInvalidos);
      return false;
    }

    return true;
  }

  // Método helper para verificar si el portafolio tiene activos con cantidad > 0
  tieneActivosValidos(portafolio: Portafolio): boolean {
    return portafolio?.activos?.some(activo => activo.cantidad > 0) || false;
  }

  // Método helper para verificar si el portafolio tiene activos con cantidad > 0
  tieneActivosConCantidad(portafolio: any): boolean {
    return portafolio?.activos?.some((activo: any) => activo.cantidad > 0) || false;
  }

  actualizarGrafico(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    // Intentar obtener el elemento directamente del DOM si ViewChild no está disponible
    let canvasElement = this.chartRef?.nativeElement;
    if (!canvasElement) {
      console.log('ViewChild no disponible, intentando obtener el elemento por ID');
      canvasElement = document.getElementById('patrimonioChart');
    }

    if (!canvasElement) {
      console.error('No se encontró el elemento canvas para el gráfico');
      return;
    }

    const ctx = canvasElement.getContext('2d');
    
    // Procesar los datos para el gráfico
    const fechas = this.historialPatrimonio.map(item => 
      new Date(item.fecha).toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short'
      })
    );

    // Crear el gráfico
    try {
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: fechas,
          datasets: [
            {
              label: 'Patrimonio Total',
              data: this.historialPatrimonio.map(item => item.patrimonioTotal),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            },
            {
              label: 'Valor del Portafolio',
              data: this.historialPatrimonio.map(item => item.valorPortafolio),
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            },
            {
              label: 'Balance Disponible',
              data: this.historialPatrimonio.map(item => item.balance),
              borderColor: 'rgb(255, 159, 64)',
              backgroundColor: 'rgba(255, 159, 64, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            }
          ]
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
              text: 'Evolución del Patrimonio'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw as number;
                  const label = context.dataset.label || '';
                  return `${label}: ${this.formatearDinero(value)}`;
                }
              }
            },
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 15
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => this.formatearDinero(value as number)
              },
              grid: {
                display: true,
                drawOnChartArea: true,
                color: 'rgba(200, 200, 200, 0.2)'
              },
              border: {
                display: true
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
      console.log('Gráfico creado correctamente');
    } catch (error) {
      console.error('Error al crear el gráfico:', error);
    }
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit ejecutado, chartRef disponible:', !!this.chartRef);
    // Esperar un tiempo más largo para asegurar que el DOM está completamente renderizado
    setTimeout(() => {
      if (this.historialPatrimonio.length > 0) {
        this.actualizarGrafico();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    if (this.actualizacionSubscription) {
      this.actualizacionSubscription.unsubscribe();
    }
  }

  // Corregir el método que está fallando alrededor de la línea 281
  private crearActivoMock(id: number, nombre: string, simbolo: string, precio: number): Activo {
    return {
      id,
      nombre,
      simbolo,
      ultimo_precio: precio,
      ultima_actualizacion: new Date(), // Añadir esta propiedad
      tipo: 'accion',
      tipoActivo: { id: 1, nombre: 'Acción' }, // Añadir esta propiedad también
      variacion: Math.random() * 10 - 5 // Variación aleatoria entre -5 y 5
    };
  }

  // También corregir cualquier otro lugar donde se cree un objeto Activo
  private mapearDatosActivo(datos: any): Activo {
    return {
      id: datos.id,
      nombre: datos.nombre,
      simbolo: datos.simbolo,
      ultimo_precio: datos.ultimo_precio,
      ultima_actualizacion: datos.ultima_actualizacion ? new Date(datos.ultima_actualizacion) : new Date(), // Añadir esta línea
      tipo: datos.tipo || 'accion',
      tipoActivo: datos.tipoActivo || { id: 1, nombre: 'Acción' }, // Añadir esta línea
      variacion: datos.variacion || 0
    };
  }
}