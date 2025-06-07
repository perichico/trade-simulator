import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Alerta } from '../../models/alerta.model';
import { Activo } from '../../models/activo.model';
import { AlertaService } from '../../services/alerta.service';
import { ActivoService } from '../../services/activo.service';
import { AuthService } from '../../services/auth.service';
import { PortafolioService } from '../../services/portafolio.service';

// Interfaz para los activos dentro del portafolio
interface ActivoEnPortafolio {
  activoId?: number;
  id?: number;
  activo_id?: number;
  nombre?: string;
  cantidad: number;
}

@Component({
  selector: 'app-alertas',
  templateUrl: './alertas.component.html',
  styleUrls: ['./alertas.component.scss']
})
export class AlertasComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Estados del componente
  alertas: Alerta[] = [];
  activos: Activo[] = [];
  portafolios: any[] = []; // Nuevo: lista de portafolios
  activosFiltrados: Activo[] = [];
  cargandoAlertas = false;
  cargandoActivos = false;
  cargandoPortafolios = false;
  
  // Formulario
  alertaForm: FormGroup;
  
  // Filtros
  filtroTexto = '';
  filtroEstado = 'todas';
  
  // Pre-población desde query params
  activoPreseleccionado: number | null = null;
  precioActualPreseleccionado: number | null = null;
  constructor(
    private fb: FormBuilder,
    private alertaService: AlertaService,
    private activoService: ActivoService,
    private authService: AuthService,
    private portafolioService: PortafolioService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.alertaForm = this.fb.group({
      activoId: ['', Validators.required],
      portafolioId: ['', Validators.required], // Nuevo campo obligatorio
      precioObjetivo: ['', [Validators.required, Validators.min(0.01)]],
      cantidadVenta: ['', [Validators.required, Validators.min(1)]],
      condicion: ['mayor', Validators.required]
    });
  }

  ngOnInit(): void {
    this.verificarAutenticacion();
    this.procesarQueryParams();
    Promise.all([
      this.cargarActivos(),
      this.cargarPortafolios()
    ]).then(() => {
      this.cargarAlertas();
    });
    this.suscribirCambiosFormulario();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private verificarAutenticacion(): void {
    this.authService.usuario$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuario => {
        if (!usuario) {
          this.router.navigate(['/login']);
        }
      });
  }

  private procesarQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['activoId']) {
          this.activoPreseleccionado = +params['activoId'];
          this.alertaForm.patchValue({ activoId: this.activoPreseleccionado });
        }
        if (params['precioActual']) {
          this.precioActualPreseleccionado = +params['precioActual'];
          this.alertaForm.patchValue({ precioObjetivo: this.precioActualPreseleccionado });
        }
      });
  }

  private suscribirCambiosFormulario(): void {
    // Reaccionar a cambios en el portafolio seleccionado
    this.alertaForm.get('portafolioId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.alertaForm.patchValue({ cantidadVenta: '' });
      });

    this.alertaForm.get('activoId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(activoId => {
        if (activoId && !this.precioActualPreseleccionado) {
          const activo = this.activos.find(a => a.id === +activoId);
          if (activo) {
            this.alertaForm.patchValue({ 
              precioObjetivo: activo.ultimo_precio 
            });
          }
        }
        // Resetear cantidad cuando cambie el activo
        if (!this.route.snapshot.queryParams['cantidadDisponible']) {
          this.alertaForm.patchValue({ cantidadVenta: '' });
        }
      });
  }

  get cantidadDisponible(): number {
    return +(this.route.snapshot.queryParams['cantidadDisponible'] || 0);
  }

  get mostrarCantidadDisponible(): boolean {
    return this.cantidadDisponible > 0 && this.activoPreseleccionado !== null;
  }

  cargarActivos(): Promise<void> {
    this.cargandoActivos = true;
    return new Promise((resolve, reject) => {
      this.activoService.obtenerActivos()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (activos) => {
            this.activos = activos;
            this.activosFiltrados = activos;
            this.cargandoActivos = false;
            // Re-enriquecer alertas si ya están cargadas
            if (this.alertas.length > 0) {
              this.alertas = this.enriquecerAlertas(this.alertas);
            }
            resolve();
          },
          error: (error) => {
            console.error('Error al cargar activos:', error);
            this.cargandoActivos = false;
            this.mostrarNotificacion('Error al cargar los activos disponibles', 'error');
            reject(error);
          }
        });
    });
  }

  cargarPortafolios(): Promise<void> {
    this.cargandoPortafolios = true;
    return new Promise((resolve, reject) => {
      const usuario = this.authService.obtenerUsuario();
      if (!usuario) {
        this.cargandoPortafolios = false;
        reject(new Error('Usuario no autenticado'));
        return;
      }

      this.portafolioService.obtenerPortafolios(usuario.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (portafolios) => {
            // Cargar cada portafolio completo con sus activos
            const promesasPortafolios = portafolios.map(portafolio => 
              this.portafolioService.obtenerPortafolioPorId(portafolio.id!).toPromise()
            );
            
            Promise.all(promesasPortafolios)
              .then(portafoliosCompletos => {
                this.portafolios = portafoliosCompletos.filter(p => p !== undefined);
                console.log('Portafolios cargados con activos:', this.portafolios);
                this.cargandoPortafolios = false;
                resolve();
              })
              .catch(error => {
                console.error('Error al cargar portafolios completos:', error);
                this.portafolios = portafolios; // Fallback a portafolios básicos
                this.cargandoPortafolios = false;
                resolve();
              });
          },
          error: (error) => {
            console.error('Error al cargar portafolios:', error);
            this.cargandoPortafolios = false;
            this.mostrarNotificacion('Error al cargar los portafolios', 'error');
            reject(error);
          }
        });
    });
  }

  cargarAlertas(): void {
    this.cargandoAlertas = true;
    this.alertaService.obtenerAlertasUsuario()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alertas) => {
          this.alertas = this.enriquecerAlertas(alertas);
          this.cargandoAlertas = false;
        },
        error: (error) => {
          console.error('Error al cargar alertas:', error);
          this.cargandoAlertas = false;
          this.mostrarNotificacion(error.message || 'Error al cargar las alertas', 'error');
        }
      });
  }

  private enriquecerAlertas(alertas: any[]): Alerta[] {
    return alertas.map(alerta => {
      const activo = this.activos.find(a => a.id === alerta.activoId);
      return {
        ...alerta,
        simboloActivo: activo?.simbolo || 'N/A',
        nombreActivo: activo?.nombre || 'Activo desconocido',
        precioActual: activo?.ultimo_precio || 0
      };
    });
  }

  // Obtener cantidad disponible del activo en el portafolio seleccionado
  get cantidadDisponibleEnPortafolio(): number {
    const portafolioId = this.alertaForm.get('portafolioId')?.value;
    const activoId = this.alertaForm.get('activoId')?.value;
    
    if (!portafolioId || !activoId) {
      console.log('Faltan IDs:', { portafolioId, activoId });
      return 0;
    }
    
    const portafolio = this.portafolios.find(p => p.id === +portafolioId);
    if (!portafolio) {
      console.log('Portafolio no encontrado:', portafolioId, 'Portafolios disponibles:', this.portafolios.map(p => ({ id: p.id, nombre: p.nombre })));
      return 0;
    }
    
    // Verificar que el portafolio tenga activos
    if (!portafolio.activos || !Array.isArray(portafolio.activos)) {
      console.log('Portafolio sin activos o activos no es array:', {
        portafolioId: portafolio.id,
        nombre: portafolio.nombre,
        activos: portafolio.activos,
        tipoActivos: typeof portafolio.activos
      });
      return 0;
    }
    
    console.log('Buscando activo en portafolio:', {
      portafolioId,
      activoId,
      activosEnPortafolio: portafolio.activos.map((a: ActivoEnPortafolio) => ({
        activoId: a.activoId || a.id || a.activo_id,
        nombre: a.nombre,
        cantidad: a.cantidad
      }))
    });
    
    // Buscar el activo específico, manejando diferentes formatos de ID
    const activo = portafolio.activos.find((a: ActivoEnPortafolio) => {
      const activoIdEnPortafolio = a.activoId || a.id || a.activo_id;
      const match = activoIdEnPortafolio === +activoId;
      if (match) {
        console.log('Activo encontrado:', {
          activoIdEnPortafolio,
          activoIdBuscado: +activoId,
          cantidad: a.cantidad,
          activo: a
        });
      }
      return match;
    });
    
    if (!activo) {
      console.log('Activo no encontrado en portafolio. ActivoId buscado:', activoId, 'Activos en portafolio:', portafolio.activos);
      return 0;
    }
    
    const cantidad = parseFloat(activo.cantidad || '0');
    console.log('Cantidad disponible encontrada:', cantidad, 'para activo:', activoId);
    return Math.floor(cantidad); // Devolver cantidad como entero
  }

  crearAlerta(): void {
    if (this.alertaForm.valid) {
      const formData = this.alertaForm.value;
      
      // Verificar cantidad disponible antes de enviar
      if (this.cantidadDisponibleEnPortafolio < formData.cantidadVenta) {
        this.mostrarNotificacion(
          `No tienes suficientes activos. Disponibles: ${this.cantidadDisponibleEnPortafolio}, solicitados: ${formData.cantidadVenta}`,
          'error'
        );
        return;
      }

      const nuevaAlerta: Alerta = {
        usuarioId: 0, // Se asigna en el backend
        portafolioId: +formData.portafolioId,
        activoId: +formData.activoId,
        precioObjetivo: +formData.precioObjetivo,
        cantidadVenta: +formData.cantidadVenta,
        condicion: formData.condicion,
        activa: true
      };

      console.log('Creando alerta:', nuevaAlerta);

      this.alertaService.crearAlerta(nuevaAlerta)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            console.log('Respuesta del servidor:', response);
            
            let mensaje = 'Alerta creada exitosamente.';
            
            if (response.venta_ejecutada) {
              // La condición ya se cumplía al crear la alerta
              mensaje = `🎯 ¡Condición cumplida inmediatamente!\n`;
              mensaje += `Se ejecutó una venta automática de ${nuevaAlerta.cantidadVenta} unidades `;
              mensaje += `de ${this.activoSeleccionado?.simbolo || 'el activo'} `;
              mensaje += `a $${response.precio_ejecutacion?.toFixed(2) || 'N/A'} por unidad.\n`;
              mensaje += `Valor total: $${(response.precio_ejecutacion * nuevaAlerta.cantidadVenta).toFixed(2)}`;
            } else {
              // Alerta creada normalmente
              const condicionTexto = nuevaAlerta.condicion === 'mayor' ? 'alcance o supere' : 'baje a';
              mensaje += ` Se venderán ${nuevaAlerta.cantidadVenta} unidades automáticamente `;
              mensaje += `cuando el precio ${condicionTexto} $${nuevaAlerta.precioObjetivo.toFixed(2)}.`;
            }
            
            this.mostrarNotificacion(mensaje, 'success');
            this.resetearFormulario();
            this.cargarAlertas();
            this.cargarPortafolios(); // Actualizar portafolios por si cambió el saldo
          },
          error: (error) => {
            console.error('Error al crear alerta:', error);
            this.mostrarNotificacion(error.message || 'Error al crear la alerta', 'error');
          }
        });
    } else {
      this.alertaForm.markAllAsTouched();
      this.mostrarNotificacion('Por favor, completa todos los campos requeridos', 'error');
    }
  }

  toggleEstadoAlerta(alerta: Alerta): void {
    if (!alerta.id) return;

    const accion = alerta.activa 
      ? this.alertaService.desactivarAlerta(alerta.id)
      : this.alertaService.activarAlerta(alerta.id);

    accion.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const estado = alerta.activa ? 'desactivada' : 'activada';
          this.mostrarNotificacion(`Alerta ${estado} correctamente`, 'success');
          this.cargarAlertas();
        },
        error: (error) => {
          this.mostrarNotificacion(error.message || 'Error al cambiar el estado de la alerta', 'error');
        }
      });
  }

  eliminarAlerta(alerta: Alerta): void {
    if (!alerta.id) return;

    if (confirm(`¿Estás seguro de que quieres eliminar la alerta para ${alerta.simboloActivo}?`)) {
      this.alertaService.eliminarAlerta(alerta.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.mostrarNotificacion('Alerta eliminada correctamente', 'success');
            this.cargarAlertas();
          },
          error: (error) => {
            this.mostrarNotificacion(error.message || 'Error al eliminar la alerta', 'error');
          }
        });
    }
  }

  filtrarActivos(evento: Event): void {
    const filtro = (evento.target as HTMLInputElement).value.toLowerCase();
    this.activosFiltrados = this.activos.filter(activo =>
      activo.nombre.toLowerCase().includes(filtro) ||
      activo.simbolo.toLowerCase().includes(filtro)
    );
  }

  aplicarFiltros(): Alerta[] {
    let alertasFiltradas = [...this.alertas];

    // Filtro por texto
    if (this.filtroTexto) {
      const texto = this.filtroTexto.toLowerCase();
      alertasFiltradas = alertasFiltradas.filter(alerta =>
        alerta.simboloActivo?.toLowerCase().includes(texto) ||
        alerta.nombreActivo?.toLowerCase().includes(texto)
      );
    }

    // Filtro por estado
    if (this.filtroEstado !== 'todas') {
      alertasFiltradas = alertasFiltradas.filter(alerta => {
        switch (this.filtroEstado) {
          case 'activas': return alerta.activa;
          case 'inactivas': return !alerta.activa;
          case 'alcanzadas': return this.esAlertaAlcanzada(alerta);
          default: return true;
        }
      });
    }

    return alertasFiltradas;
  }

  esAlertaAlcanzada(alerta: Alerta): boolean {
    if (!alerta.precioActual || !alerta.condicion) return false;
    
    return alerta.condicion === 'mayor' 
      ? alerta.precioActual >= alerta.precioObjetivo
      : alerta.precioActual <= alerta.precioObjetivo;
  }

  calcularProgreso(alerta: Alerta): number {
    if (!alerta.precioActual) return 0;
    
    const progreso = (alerta.precioActual / alerta.precioObjetivo) * 100;
    return Math.min(Math.max(progreso, 0), 100);
  }

  resetearFormulario(): void {
    this.alertaForm.reset();
    this.alertaForm.patchValue({ condicion: 'mayor' });
    this.activoPreseleccionado = null;
    this.precioActualPreseleccionado = null;
  }

  refrescarDatos(): void {
    this.cargarActivos().then(() => {
      this.cargarAlertas();
    });
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info'): void {
    this.router.navigate(['/notificacion-temporal'], {
      queryParams: {
        mensaje: mensaje,
        tipo: tipo,
        retorno: '/alertas'
      }
    });
  }

  // Getters para el template
  get alertasFiltradas(): Alerta[] {
    return this.aplicarFiltros();
  }

  get activoSeleccionado(): Activo | null {
    const activoId = this.alertaForm.get('activoId')?.value;
    return activoId ? this.activos.find(a => a.id === +activoId) || null : null;
  }

  getAlertasActivasCount(): number {
    return this.alertas.filter(alerta => alerta.activa).length;
  }
}