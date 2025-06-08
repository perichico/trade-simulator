import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

interface Activo {
  id: number;
  nombre: string;
  simbolo: string;
  tipoActivo: string; // Nombre del tipo de activo
  tipoActivoId: number; // ID del tipo de activo
  tipo_activo_id?: number; // Alias para compatibilidad con backend
  ultimoPrecio: number;
  ultimo_precio?: number; // Alias para compatibilidad con backend
  ultimaActualizacion: Date;
  ultima_actualizacion?: Date; // Alias para compatibilidad con backend
  porcentajeDividendo: number;
  porcentaje_dividendo?: number; // Alias para compatibilidad con backend
  frecuenciaDividendo: string;
  frecuencia_dividendo?: string; // Alias para compatibilidad con backend
  ultimaFechaDividendo?: Date;
  ultima_fecha_dividendo?: Date; // Alias para compatibilidad con backend
  tieneDividendos?: boolean;
  diasSinActualizar?: number;
}

@Component({
  selector: 'app-admin-activos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-activos.component.html',
  styleUrls: ['./admin-activos.component.css']
})
export class AdminActivosComponent implements OnInit {
  activos: Activo[] = [];
  activosFiltrados: Activo[] = [];
  estadisticas: any = null;
  cargando = false;
  mostrandoFormulario = false;
  editandoActivo: Activo | null = null;
  
  // Filtros
  filtroTexto = '';
  filtroTipo = 'todos';

  // Formulario para nuevo activo
  nuevoActivo = {
    nombre: '',
    simbolo: '',
    tipoActivoId: 1,
    porcentajeDividendo: 0,
    frecuenciaDividendo: 'trimestral'
  };

  // Tipos de activos - ahora se cargarán dinámicamente
  tiposActivos: any[] = [];

  frecuenciasDividendo = ['mensual', 'trimestral', 'semestral', 'anual'];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log('=== INICIANDO AdminActivosComponent ===');
    
    // Verificar sesión primero
    this.authService.verificarSesion().subscribe({
      next: (autenticado) => {
        console.log('Verificación de sesión:', autenticado);
        const usuario = this.authService.obtenerUsuario();
        console.log('Usuario actual:', usuario);
        
        if (!autenticado || !usuario) {
          console.log('Usuario no autenticado, redirigiendo a login');
          this.snackBar.open('Sesión expirada. Por favor, inicia sesión nuevamente.', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/login']);
          return;
        }
        
        if (usuario.rol !== 'admin') {
          console.log('Usuario no es admin, rol:', usuario.rol);
          this.snackBar.open('No tienes permisos para acceder a esta página', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/dashboard']);
          return;
        }
        
        console.log('Usuario admin verificado, cargando datos...');
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error verificando sesión:', error);
        this.snackBar.open('Error al verificar la sesión', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/login']);
      }
    });
  }

  cargarDatos() {
    this.cargarTiposActivos();
    this.cargarActivos();
    this.cargarEstadisticas();
  }

  cargarTiposActivos(): void {
    console.log('Iniciando carga de tipos de activos...');
    
    this.adminService.obtenerTiposActivos().subscribe({
      next: (tipos) => {
        console.log('Tipos de activos recibidos:', tipos);
        this.tiposActivos = tipos || [];
        
        // Si hay tipos disponibles y el formulario no tiene tipo seleccionado, usar el primero
        if (tipos && tipos.length > 0 && !this.nuevoActivo.tipoActivoId) {
          this.nuevoActivo.tipoActivoId = tipos[0].id;
        }
      },
      error: (error) => {
        console.error('Error al cargar tipos de activos:', error);
        // Fallback a tipos por defecto en caso de error
        this.tiposActivos = [
          { id: 1, nombre: 'Acción' },
          { id: 2, nombre: 'ETF' },
          { id: 3, nombre: 'Bonos' },
          { id: 4, nombre: 'Materias Primas' },
          { id: 5, nombre: 'Criptomonedas' },
          { id: 6, nombre: 'Forex' }
        ];
        console.log('Usando tipos por defecto:', this.tiposActivos);
        this.snackBar.open('Tipos de activos cargados desde valores por defecto', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cargarActivos(): void {
    this.cargando = true;
    console.log('Iniciando carga de activos...');
    
    this.adminService.obtenerActivos().subscribe({
      next: (respuesta: any) => {
        console.log('=== RESPUESTA DEL SERVIDOR ===');
        console.log('Respuesta completa:', respuesta);
        console.log('Tipo de respuesta:', typeof respuesta);
        console.log('Es array?:', Array.isArray(respuesta));
        
        // Manejar tanto array directo como objeto con propiedad activos
        let activos: Activo[];
        if (Array.isArray(respuesta)) {
          activos = respuesta;
          console.log('Respuesta es array directo');
        } else if (respuesta && respuesta.activos && Array.isArray(respuesta.activos)) {
          activos = respuesta.activos;
          console.log('Respuesta tiene propiedad activos');
        } else {
          console.error('Formato de respuesta inesperado:', respuesta);
          activos = [];
        }
        
        console.log('Activos extraídos:', activos);
        console.log('Cantidad de activos:', activos.length);
        
        // Log individual de cada activo
        activos.forEach((activo, index) => {
          console.log(`Activo ${index + 1}:`, {
            id: activo.id,
            nombre: activo.nombre,
            simbolo: activo.simbolo,
            tipoActivo: activo.tipoActivo
          });
        });
        
        this.activos = activos;
        this.aplicarFiltros();
        this.cargando = false;
        
        // Mostrar mensaje si no hay activos
        if (activos.length === 0) {
          this.snackBar.open('No hay activos registrados en el sistema', 'Cerrar', { duration: 5000 });
        } else {
          console.log(`✅ Se cargaron ${activos.length} activos correctamente`);
        }
      },
      error: (error) => {
        console.log('=== ERROR EN CARGA DE ACTIVOS ===');
        console.error('Error completo:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Error body:', error.error);
        
        this.activos = [];
        this.activosFiltrados = [];
        this.cargando = false;
        
        if (error.status === 401) {
          this.snackBar.open('Sesión expirada. Redirigiendo al login...', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          this.snackBar.open('No tienes permisos de administrador', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        } else {
          this.snackBar.open(`Error al cargar activos: ${error.error?.error || error.message}`, 'Cerrar', { duration: 5000 });
        }
      }
    });
  }

  cargarEstadisticas(): void {
    console.log('Iniciando carga de estadísticas de activos...');
    
    this.adminService.obtenerEstadisticasActivos().subscribe({
      next: (stats) => {
        console.log('Estadísticas de activos recibidas:', stats);
        this.estadisticas = stats;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas de activos:', error);
        this.snackBar.open(`Error al cargar estadísticas: ${error.error?.error || error.message}`, 'Cerrar', { duration: 5000 });
        this.estadisticas = null;
      }
    });
  }

  aplicarFiltros(): void {
    console.log('=== APLICANDO FILTROS ===');
    console.log('Activos totales antes del filtro:', this.activos.length);
    console.log('Filtro texto:', this.filtroTexto);
    console.log('Filtro tipo:', this.filtroTipo);
    
    let filtrados = [...this.activos];

    // Filtro por texto
    if (this.filtroTexto.trim()) {
      const texto = this.filtroTexto.toLowerCase();
      filtrados = filtrados.filter(activo => 
        activo.nombre?.toLowerCase().includes(texto) ||
        activo.simbolo?.toLowerCase().includes(texto)
      );
      console.log(`Después del filtro por texto: ${filtrados.length} activos`);
    }

    // Filtro por tipo - usando ID del tipo en lugar del nombre
    if (this.filtroTipo !== 'todos') {
      const tipoIdSeleccionado = parseInt(this.filtroTipo);
      filtrados = filtrados.filter(activo => {
        const tipoId = activo.tipoActivoId;
        console.log(`Comparando activo ${activo.nombre}: tipoId=${tipoId} con filtro=${tipoIdSeleccionado}`);
        return tipoId === tipoIdSeleccionado;
      });
      console.log(`Después del filtro por tipo: ${filtrados.length} activos`);
    }

    console.log('Activos filtrados final:', filtrados.length);
    this.activosFiltrados = filtrados;
  }

  mostrarFormularioCrear(): void {
    this.mostrandoFormulario = true;
    this.editandoActivo = null;
    this.nuevoActivo = {
      nombre: '',
      simbolo: '',
      tipoActivoId: this.tiposActivos.length > 0 ? this.tiposActivos[0].id : 1,
      porcentajeDividendo: 0,
      frecuenciaDividendo: 'trimestral'
    };
  }

  editarActivo(activo: Activo): void {
    this.mostrandoFormulario = true;
    this.editandoActivo = activo;
    this.nuevoActivo = {
      nombre: activo.nombre,
      simbolo: activo.simbolo,
      tipoActivoId: activo.tipoActivoId,
      porcentajeDividendo: activo.porcentajeDividendo,
      frecuenciaDividendo: activo.frecuenciaDividendo
    };
  }

  cancelarFormulario(): void {
    this.mostrandoFormulario = false;
    this.editandoActivo = null;
  }

  guardarActivo(): void {
    if (this.editandoActivo) {
      // Actualizar activo existente
      this.adminService.actualizarActivo(this.editandoActivo.id, this.nuevoActivo).subscribe({
        next: (response) => {
          this.snackBar.open('Activo actualizado correctamente', 'Cerrar', { duration: 3000 });
          this.cargarActivos();
          this.cancelarFormulario();
        },
        error: (error) => {
          console.error('Error al actualizar activo:', error);
          this.snackBar.open('Error al actualizar activo', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      // Crear nuevo activo
      this.adminService.crearActivo(this.nuevoActivo).subscribe({
        next: (response) => {
          this.snackBar.open('Activo creado correctamente', 'Cerrar', { duration: 3000 });
          this.cargarActivos();
          this.cancelarFormulario();
        },
        error: (error) => {
          console.error('Error al crear activo:', error);
          this.snackBar.open('Error al crear activo', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  confirmarEliminarActivo(activo: Activo): void {
    if (confirm(`¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE el activo ${activo.nombre}? Esta acción no se puede deshacer.`)) {
      this.eliminarActivo(activo);
    }
  }

  private eliminarActivo(activo: Activo): void {
    this.adminService.eliminarActivo(activo.id).subscribe({
      next: (response) => {
        this.activos = this.activos.filter(a => a.id !== activo.id);
        this.aplicarFiltros();
        this.snackBar.open('Activo eliminado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error al eliminar activo:', error);
        this.snackBar.open(error.error?.error || 'Error al eliminar activo', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Métodos auxiliares mejorados
  formatearPrecio(precio: number): string {
    return precio ? `$${precio.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return 'N/A';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearFechaDividendo(fecha: string | Date): string {
    if (!fecha) return 'No establecida';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  obtenerNombreTipo(tipoId: number): string {
    const tipo = this.tiposActivos.find(t => t.id === tipoId);
    return tipo ? tipo.nombre : 'Desconocido';
  }

  obtenerClaseEstadoActualizacion(dias: number): string {
    if (dias === 0) return 'text-success';
    if (dias <= 1) return 'text-warning';
    return 'text-danger';
  }

  obtenerTextoEstadoActualizacion(dias: number): string {
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    return `Hace ${dias} días`;
  }

  formatearFrecuenciaDividendo(frecuencia: string): string {
    const frecuencias: { [key: string]: string } = {
      'mensual': 'Mensual',
      'trimestral': 'Trimestral',
      'semestral': 'Semestral',
      'anual': 'Anual'
    };
    return frecuencias[frecuencia] || frecuencia;
  }
}
