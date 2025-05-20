import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Alerta } from '../../models/alerta.model';
import { AlertaService } from '../../services/alerta.service';
import { ActivoService } from '../../services/activo.service';
import { Activo } from '../../models/activo.model';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError, throwError } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-alertas',
  templateUrl: './alertas.component.html',
  styleUrls: ['./alertas.component.scss']
})
export class AlertasComponent implements OnInit {
  alertas: Alerta[] = [];
  activos: Activo[] = [];
  alertaForm: FormGroup;
  displayedColumns: string[] = ['activo', 'precioObjetivo', 'cantidadVenta', 'estado', 'acciones'];

  constructor(
    private alertaService: AlertaService,
    private activoService: ActivoService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
    this.alertaForm = this.formBuilder.group({
      activoId: ['', Validators.required],
      precioObjetivo: ['', [Validators.required, Validators.min(0)]],
      cantidadVenta: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.verificarConexion();
    this.cargarAlertas();
    this.cargarActivos();
  }

  verificarConexion(): void {
    // Hacemos una petición simple para verificar la conectividad
    this.http.get(`${environment.apiUrl}/health`, { responseType: 'text' })
      .pipe(
        timeout(5000),
        catchError(error => {
          console.error('Error de conectividad con el servidor:', error);
          this.mostrarError(`No se puede conectar con el servidor: ${error.message || 'Error desconocido'}`);
          return throwError(() => error);
        })
      )
      .subscribe(response => {
        console.log('Conectividad con el servidor: OK', response);
      });
  }

  cargarAlertas(): void {
    console.log('Iniciando carga de alertas...');
    this.alertaService.obtenerAlertasUsuario().subscribe({
      next: (alertas) => {
        console.log('Alertas recibidas correctamente:', alertas);
        this.alertas = alertas;
      },
      error: (error) => {
        console.error('Error detallado al cargar alertas:', error);
        let mensajeError = 'Error al cargar las alertas';
        
        if (error.error && error.error.message) {
          mensajeError += `: ${error.error.message}`;
        } else if (error.message) {
          mensajeError += `: ${error.message}`;
        }
        
        this.mostrarError(mensajeError);
        
        // Intentar recuperarse del error cargando datos en caché o dummy
        this.alertas = this.obtenerAlertasDeRespaldo();
      },
      complete: () => console.log('Carga de alertas completada')
    });
  }

  obtenerAlertasDeRespaldo(): Alerta[] {
    // Intentar recuperar datos de localStorage si existen
    const alertasCached = localStorage.getItem('alertas_cache');
    if (alertasCached) {
      try {
        return JSON.parse(alertasCached);
      } catch (e) {
        console.warn('Error al recuperar alertas de caché:', e);
      }
    }
    
    // Si no hay caché, devolver un array vacío
    return [];
  }

  // Método para guardar caché de alertas (llamar después de operaciones exitosas)
  guardarAlertasEnCache(alertas: Alerta[]): void {
    try {
      localStorage.setItem('alertas_cache', JSON.stringify(alertas));
    } catch (e) {
      console.warn('Error al guardar alertas en caché:', e);
    }
  }

  cargarActivos(): void {
    this.activoService.obtenerActivos().subscribe({
      next: (activos) => this.activos = activos,
      error: (error) => this.mostrarError('Error al cargar los activos')
    });
  }

  debugValoresAlerta(): void {
    console.log('Valores del formulario:', this.alertaForm.value);
    console.log('Estado del formulario:', {
      valid: this.alertaForm.valid,
      touched: this.alertaForm.touched,
      dirty: this.alertaForm.dirty,
      errors: {
        activoId: this.alertaForm.get('activoId')?.errors,
        precioObjetivo: this.alertaForm.get('precioObjetivo')?.errors,
        cantidadVenta: this.alertaForm.get('cantidadVenta')?.errors
      }
    });
  }

  crearAlerta(): void {
    this.debugValoresAlerta();
    
    if (this.alertaForm.valid) {
      const nuevaAlerta: Alerta = {
        ...this.alertaForm.value,
        usuarioId: 0, // Se asignará en el backend
        activa: true
      };

      console.log('Enviando alerta al servidor:', nuevaAlerta);

      this.alertaService.crearAlerta(nuevaAlerta).subscribe({
        next: (respuesta) => {
          console.log('Respuesta exitosa del servidor:', respuesta);
          this.cargarAlertas();
          this.alertaForm.reset();
          this.mostrarExito('Alerta creada con éxito');
        },
        error: (error) => {
          console.error('Error detallado al crear la alerta:', error);
          let mensajeError = 'Error al crear la alerta';
          
          if (error.error && error.error.message) {
            mensajeError += `: ${error.error.message}`;
          } else if (error.message) {
            mensajeError += `: ${error.message}`;
          }
          
          this.mostrarError(mensajeError);
        }
      });
    } else {
      this.alertaForm.markAllAsTouched();
      this.mostrarError('Por favor, complete todos los campos correctamente');
    }
  }

  toggleAlerta(alerta: Alerta): void {
    const accion = alerta.activa ? 
      this.alertaService.desactivarAlerta(alerta.id!) :
      this.alertaService.activarAlerta(alerta.id!);

    accion.subscribe({
      next: () => {
        this.cargarAlertas();
        this.mostrarExito(`Alerta ${alerta.activa ? 'desactivada' : 'activada'} con éxito`);
      },
      error: (error) => this.mostrarError(`Error al ${alerta.activa ? 'desactivar' : 'activar'} la alerta`)
    });
  }

  eliminarAlerta(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar esta alerta?')) {
      this.alertaService.eliminarAlerta(id).subscribe({
        next: () => {
          this.cargarAlertas();
          this.mostrarExito('Alerta eliminada con éxito');
        },
        error: (error) => this.mostrarError('Error al eliminar la alerta')
      });
    }
  }

  limpiarFormulario() {
    this.alertaForm.reset();
  }

  actualizarAlertas() {
    // Recargar alertas desde el servidor
    this.cargarAlertas();
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    // Implementar filtrado según tus necesidades
  }

  mostrarPrecioActual(): boolean {
    return this.alertaForm.get('activoId')?.value !== null;
  }

  getPrecioActual(): number {
    const activoId = this.alertaForm.get('activoId')?.value;
    if (!activoId) return 0;
    
    const activo = this.activos.find(a => a.id === activoId);
    return activo?.ultimo_precio || 0;
  }

  mostrarCantidadDisponible(): boolean {
    return this.alertaForm.get('activoId')?.value !== null;
  }

  getCantidadDisponible(): number {
    const activoId = this.alertaForm.get('activoId')?.value;
    if (!activoId) return 0;
    
    // Obtener la cantidad disponible del activo seleccionado en el portafolio
    // Implementar según tu lógica de negocio
    return 100; // Valor de ejemplo
  }

  getPrecioActualDelActivo(activoId: number): number {
    const activo = this.activos.find(a => a.id === activoId);
    return activo?.ultimo_precio || 0;
  }

  getSimboloActivo(activoId: number): string {
    const activo = this.activos.find(a => a.id === activoId);
    return activo?.simbolo || '';
  }

  esPrecioFavorable(alerta: Alerta): boolean {
    const precioActual = this.getPrecioActualDelActivo(alerta.activoId);
    return precioActual >= alerta.precioObjetivo;
  }

  mostrarProgreso(alerta: Alerta): boolean {
    return this.getPrecioActualDelActivo(alerta.activoId) > 0;
  }

  calcularPorcentajeProgreso(alerta: Alerta): number {
    const precioActual = this.getPrecioActualDelActivo(alerta.activoId);
    if (precioActual <= 0) return 0;
    
    const porcentaje = (precioActual / alerta.precioObjetivo) * 100;
    return Math.min(Math.round(porcentaje), 100);
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  getNombreActivo(activoId: number): string {
    const activo = this.activos.find(a => a.id === activoId);
    return activo ? activo.nombre : '';
  }
}