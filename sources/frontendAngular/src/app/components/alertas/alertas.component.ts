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
  activosFiltrados: Activo[] = [];
  cargandoAlertas = false;
  cargandoActivos = false;
  
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
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.alertaForm = this.fb.group({
      activoId: ['', Validators.required],
      precioObjetivo: ['', [Validators.required, Validators.min(0.01)]],
      cantidadVenta: ['', [Validators.min(1)]],
      condicion: ['mayor', Validators.required]
    });
  }

  ngOnInit(): void {
    this.verificarAutenticacion();
    this.procesarQueryParams();
    this.cargarActivos();
    this.cargarAlertas();
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
      });
  }

  cargarActivos(): void {
    this.cargandoActivos = true;
    this.activoService.obtenerActivos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (activos) => {
          this.activos = activos;
          this.activosFiltrados = activos;
          this.cargandoActivos = false;
        },
        error: (error) => {
          console.error('Error al cargar activos:', error);
          this.cargandoActivos = false;
          this.mostrarNotificacion('Error al cargar los activos disponibles', 'error');
        }
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

  private enriquecerAlertas(alertas: Alerta[]): Alerta[] {
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

  crearAlerta(): void {
    if (this.alertaForm.valid) {
      const formData = this.alertaForm.value;
      const nuevaAlerta: Alerta = {
        usuarioId: 0, // Se asigna en el backend
        activoId: +formData.activoId,
        precioObjetivo: +formData.precioObjetivo,
        cantidadVenta: formData.cantidadVenta ? +formData.cantidadVenta : undefined,
        condicion: formData.condicion,
        activa: true
      };

      this.alertaService.crearAlerta(nuevaAlerta)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.mostrarNotificacion('Alerta creada exitosamente', 'success');
            this.resetearFormulario();
            this.cargarAlertas();
          },
          error: (error) => {
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
    this.cargarActivos();
    this.cargarAlertas();
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