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
        // Recalcular y validar datos inmediatamente
        this.validarYRecalcularDatosPortafolio(portafolio);
      })
    );
    
    // Suscribirse al portafolio actual
    this.actualizacionSubscription = this.portafolioService.seleccionarPortafolio(portafolioId).subscribe(portafolio => {
      this.portafolioSeleccionado = portafolio;
      console.log('Portafolio seleccionado actualizado:', portafolio);
      
      // Validar y recalcular datos
      this.validarYRecalcularDatosPortafolio(portafolio);
      
      // Actualizar el historial de patrimonio al cambiar de portafolio
      if (this.usuario) {
        this.cargarHistorialPatrimonio(this.usuario.id, portafolioId);
      }
    });
  }

  // Nuevo método para validar y recalcular datos del portafolio
  validarYRecalcularDatosPortafolio(portafolio: Portafolio): void {
    if (!portafolio || !portafolio.activos) {
      console.warn('Portafolio sin activos para validar');
      return;
    }

    console.log('=== VALIDACIÓN Y RECÁLCULO DE DATOS ===');
    console.log('Portafolio original:', portafolio);

    // Recalcular valores para cada activo
    portafolio.activos.forEach((activo, index) => {
      const valorTotalCalculado = (activo.cantidad || 0) * (activo.precioActual || 0);
      const rendimientoCalculado = valorTotalCalculado - ((activo.cantidad || 0) * (activo.precioCompra || 0));
      const rendimientoPorcentajeCalculado = activo.precioCompra > 0 
        ? ((activo.precioActual - activo.precioCompra) / activo.precioCompra) * 100 
        : 0;

      // Comparar valores calculados con los recibidos
      console.log(`Activo ${index} (${activo.simbolo}):`);
      console.log(`  Cantidad: ${activo.cantidad}`);
      console.log(`  Precio Compra: ${activo.precioCompra}`);
      console.log(`  Precio Actual: ${activo.precioActual}`);
      console.log(`  Valor Total - Recibido: ${activo.valorTotal}, Calculado: ${valorTotalCalculado}`);
      console.log(`  Rendimiento - Recibido: ${activo.rendimiento}, Calculado: ${rendimientoCalculado}`);
      console.log(`  Rendimiento % - Recibido: ${activo.rendimientoPorcentaje}, Calculado: ${rendimientoPorcentajeCalculado}`);

      // Actualizar con valores calculados si hay discrepancias significativas
      if (Math.abs((activo.valorTotal || 0) - valorTotalCalculado) > 0.01) {
        console.warn(`Discrepancia en valor total del activo ${activo.simbolo}. Corrigiendo...`);
        activo.valorTotal = Math.round(valorTotalCalculado * 100) / 100;
      }

      if (Math.abs((activo.rendimiento || 0) - rendimientoCalculado) > 0.01) {
        console.warn(`Discrepancia en rendimiento del activo ${activo.simbolo}. Corrigiendo...`);
        activo.rendimiento = Math.round(rendimientoCalculado * 100) / 100;
      }

      if (Math.abs((activo.rendimientoPorcentaje || 0) - rendimientoPorcentajeCalculado) > 0.01) {
        console.warn(`Discrepancia en rendimiento porcentual del activo ${activo.simbolo}. Corrigiendo...`);
        activo.rendimientoPorcentaje = Math.round(rendimientoPorcentajeCalculado * 100) / 100;
      }
    });

    console.log('Portafolio después de la validación:', portafolio);
    console.log('=== FIN VALIDACIÓN ===');
  }

  // Método mejorado para obtener el valor total del portafolio con validación
  obtenerValorTotalPortafolio(): number {
    if (!this.portafolioSeleccionado || !this.portafolioSeleccionado.activos) {
      return 0;
    }

    const valorTotal = this.portafolioSeleccionado.activos.reduce((total, activo) => {
      // Calcular valor total directamente para mayor precisión
      const valorCalculado = (activo.cantidad || 0) * (activo.precioActual || 0);
      return total + valorCalculado;
    }, 0);
    
    const valorTotalRedondeado = Math.round(valorTotal * 100) / 100;
    console.log('Valor total del portafolio calculado:', valorTotalRedondeado);
    return valorTotalRedondeado;
  }

  // Método mejorado para obtener el rendimiento total con validación
  obtenerRendimientoTotal(): number {
    if (!this.portafolioSeleccionado || !this.portafolioSeleccionado.activos) {
      return 0;
    }

    const rendimientoTotal = this.portafolioSeleccionado.activos.reduce((total, activo) => {
      // Calcular rendimiento directamente para mayor precisión
      const valorActual = (activo.cantidad || 0) * (activo.precioActual || 0);
      const valorCompra = (activo.cantidad || 0) * (activo.precioCompra || 0);
      const rendimientoCalculado = valorActual - valorCompra;
      return total + rendimientoCalculado;
    }, 0);
    
    const rendimientoTotalRedondeado = Math.round(rendimientoTotal * 100) / 100;
    console.log('Rendimiento total calculado:', rendimientoTotalRedondeado);
    return rendimientoTotalRedondeado;
  }

  // Método para obtener el patrimonio total (saldo + valor de activos)
  obtenerPatrimonioTotal(): number {
    if (!this.portafolioSeleccionado) {
      return 0;
    }

    const saldoActual = this.portafolioSeleccionado.saldo || 0;
    const valorActivos = this.obtenerValorTotalPortafolio();
    const patrimonioTotal = saldoActual + valorActivos;
    
    console.log('Patrimonio total:', {
      saldo: saldoActual,
      valorActivos: valorActivos,
      patrimonioTotal: patrimonioTotal
    });
    return patrimonioTotal;
  }

  // Método para obtener datos específicos de un activo with cálculos precisos
  obtenerDatosActivoPreciso(activo: any): any {
    const cantidad = activo.cantidad || 0;
    const precioCompra = activo.precioCompra || 0;
    const precioActual = activo.precioActual || 0;
    
    const valorTotal = Math.round((cantidad * precioActual) * 100) / 100;
    const valorCompra = Math.round((cantidad * precioCompra) * 100) / 100;
    const rendimiento = Math.round((valorTotal - valorCompra) * 100) / 100;
    const rendimientoPorcentaje = precioCompra > 0 
      ? Math.round(((precioActual - precioCompra) / precioCompra) * 10000) / 100 
      : 0;

    return {
      ...activo,
      valorTotal,
      rendimiento,
      rendimientoPorcentaje
    };
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

  // Método para seleccionar el portafolio a eliminar
  seleccionarPortafolioAEliminar(portafolioId: number): void {
    this.portafolioAEliminar = portafolioId;
  }

  // Método para confirmar y eliminar el portafolio seleccionado
  confirmarEliminarPortafolio(): void {
    if (!this.portafolioAEliminar || !this.usuario || this.portafolios.length <= 1) {
      this.snackBar.open('No se puede eliminar el portafolio', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    const portafolioAEliminar = this.portafolios.find(p => p.id === this.portafolioAEliminar);
    if (!portafolioAEliminar) {
      this.snackBar.open('Portafolio no encontrado', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.portafolioService.eliminarPortafolio(this.portafolioAEliminar)
      .subscribe({
        next: () => {
          // Remover el portafolio de la lista
          this.portafolios = this.portafolios.filter(p => p.id !== this.portafolioAEliminar);
          
          // Si el portafolio eliminado era el seleccionado, seleccionar otro
          if (this.portafolioSeleccionado?.id === this.portafolioAEliminar) {
            const primerPortafolio = this.portafolios[0];
            if (primerPortafolio) {
              this.seleccionarPortafolio(primerPortafolio.id!);
            }
          }
          
          this.snackBar.open(`Portafolio "${portafolioAEliminar.nombre}" eliminado con éxito`, 'Cerrar', {
            duration: 3000
          });
          
          // Resetear la selección
          this.portafolioAEliminar = null;
          
          // Cerrar el modal
          const modalElement = document.getElementById('eliminarPortafolioModal');
          if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
              modal.hide();
            }
          }
        },
        error: (error) => {
          this.snackBar.open(
            `Error al eliminar el portafolio: ${error.error?.error || 'Error desconocido'}`, 
            'Cerrar', 
            { duration: 5000 }
          );
        }
      });
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
      
      // Saldo inicial de 10,000€
      const saldoInicial = 10000;
      
      // Generar datos de muestra para los últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(hoy.getDate() - i);
        
        // Variación más sutil para datos genéricos
        const variacion = 0.98 + (Math.random() * 0.04);
        
        const balanceBase = saldoInicial * variacion;
        const valorPortafolioBase = 0; // Sin activos en portafolio genérico
        const patrimonioTotalBase = balanceBase + valorPortafolioBase;
        const rendimientoTotalBase = patrimonioTotalBase - saldoInicial;
        
        datosMuestra.push({
          usuarioId: usuarioId,
          fecha: fecha.toISOString(),
          balance: Math.round(balanceBase * 100) / 100,
          valorPortafolio: valorPortafolioBase,
          patrimonioTotal: Math.round(patrimonioTotalBase * 100) / 100,
          rendimientoTotal: Math.round(rendimientoTotalBase * 100) / 100
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
    const saldoActual = portafolio.saldo || 0;
    const valorPortafolioActual = this.obtenerValorTotalPortafolio();
    const patrimonioTotalActual = this.obtenerPatrimonioTotal();
    
    // Generar datos de muestra para los últimos 7 días con valores más realistas
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(hoy.getDate() - i);
      
      // Para el día actual, usar valores exactos
      if (i === 0) {
        datosMuestra.push({
          usuarioId: portafolio.usuarioId || 0,
          fecha: fecha.toISOString(),
          balance: saldoActual,
          valorPortafolio: valorPortafolioActual,
          patrimonioTotal: patrimonioTotalActual,
          rendimientoTotal: this.obtenerRendimientoTotal()
        });
      } else {
        // Para días anteriores, generar variaciones más sutiles
        const factorVariacion = 0.98 + (Math.random() * 0.04); // Variación entre 98% y 102%
        
        const balanceDia = saldoActual * factorVariacion;
        const valorPortafolioDia = valorPortafolioActual * factorVariacion;
        const patrimonioTotalDia = balanceDia + valorPortafolioDia;
        const rendimientoTotalDia = this.obtenerRendimientoTotal() * factorVariacion;
        
        datosMuestra.push({
          usuarioId: portafolio.usuarioId || 0,
          fecha: fecha.toISOString(),
          balance: Math.round(balanceDia * 100) / 100,
          valorPortafolio: Math.round(valorPortafolioDia * 100) / 100,
          patrimonioTotal: Math.round(patrimonioTotalDia * 100) / 100,
          rendimientoTotal: Math.round(rendimientoTotalDia * 100) / 100
        });
      }
    }
    
    // Ordenar por fecha
    datosMuestra.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    this.historialPatrimonio = datosMuestra;
    
    console.log('Datos simulados generados:', this.historialPatrimonio);
  }

  // Método helper para debug de valores del portafolio
  debugValoresPortafolio(): void {
    if (!this.portafolioSeleccionado) {
      console.log('No hay portafolio seleccionado para debug');
      return;
    }

    console.log('=== DEBUG VALORES PORTAFOLIO ===');
    console.log('Saldo:', this.portafolioSeleccionado.saldo);
    console.log('Valor total activos:', this.obtenerValorTotalPortafolio());
    console.log('Patrimonio total:', this.obtenerPatrimonioTotal());
    console.log('Rendimiento total:', this.obtenerRendimientoTotal());
    console.log('Rendimiento porcentual:', this.calcularRendimientoPorcentual());
    
    if (this.portafolioSeleccionado.activos) {
      console.log('Activos detalle:');
      this.portafolioSeleccionado.activos.forEach((activo, index) => {
        const valorActual = (activo.cantidad || 0) * (activo.precioActual || 0);
        const valorCompra = (activo.cantidad || 0) * (activo.precioCompra || 0);
        const rendimiento = valorActual - valorCompra;
        
        console.log(`  ${index}: ${activo.simbolo} - Cantidad: ${activo.cantidad}, Precio Compra: ${activo.precioCompra}, Precio Actual: ${activo.precioActual}, Valor: ${valorActual}, Rendimiento: ${rendimiento}`);
      });
    }
    console.log('=== FIN DEBUG ===');
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

  // Método helper para verificar si el portafolio tiene activos con cantidad > 0
  tieneActivosConCantidad(portafolio: any): boolean {
    return portafolio?.activos?.some((activo: any) => activo.cantidad > 0) || false;
  }
}