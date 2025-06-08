import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';
import { DividendoService, Dividendo } from '../../services/dividendo.service';
import { AuthService } from '../../services/auth.service';

interface Activo {
  id: number;
  nombre: string;
  simbolo: string;
  porcentajeDividendo: number;
  frecuenciaDividendo: string;
  ultimaFechaDividendo?: Date;
  ultimoPrecio: number;
}

interface EstadisticasDividendos {
  totalDividendosPagados: number;
  totalDividendosPendientes: number;
  montoTotalDividendos: number;
  activosConDividendos: number;
}

@Component({
  selector: 'app-admin-dividendos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dividendos.component.html',
  styleUrls: ['./admin-dividendos.component.css']
})
export class AdminDividendosComponent implements OnInit {
  dividendos: Dividendo[] = [];
  activos: Activo[] = [];
  activosConDividendos: Activo[] = [];
  estadisticas: EstadisticasDividendos | null = null;
  cargando = false;
  procesandoDividendos = false;
  
  // Filtros
  filtroEstado = 'todos';
  filtroActivo = 'todos';
  
  // Formulario para generar dividendo manual
  mostrandoFormulario = false;
  dividendoManual = {
    activoId: 0,
    montoPorAccion: 0,
    fechaPago: new Date().toISOString().split('T')[0]
  };

  // Variables para modal de detalles
  mostrandoDetalles = false;
  dividendoSeleccionado: Dividendo | null = null;
  estadisticasDividendo: any = null;

  constructor(
    private adminService: AdminService,
    private dividendoService: DividendoService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.verificarPermisos();
  }

  verificarPermisos(): void {
    this.authService.verificarSesion().subscribe({
      next: (autenticado) => {
        const usuario = this.authService.obtenerUsuario();
        
        if (!autenticado || !usuario || usuario.rol !== 'admin') {
          this.snackBar.open('No tienes permisos para acceder a esta página', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/dashboard']);
          return;
        }
        
        this.cargarDatos();
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  cargarDatos(): void {
    this.cargarDividendos();
    this.cargarActivos();
    this.cargarEstadisticas();
  }

  cargarDividendos(): void {
    this.cargando = true;
    this.dividendoService.obtenerDividendos().subscribe({
      next: (dividendos) => {
        this.dividendos = dividendos;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar dividendos:', error);
        this.snackBar.open('Error al cargar dividendos', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      }
    });
  }

  cargarActivos(): void {
    this.adminService.obtenerActivos().subscribe({
      next: (activos) => {
        this.activos = activos || [];
        this.activosConDividendos = this.activos.filter(a => a.porcentajeDividendo > 0);
      },
      error: (error) => {
        console.error('Error al cargar activos:', error);
      }
    });
  }

  cargarEstadisticas(): void {
    // Calcular estadísticas localmente desde los dividendos cargados
    const dividendosPagados = this.dividendos.filter(d => d.estado === 'pagado');
    const dividendosPendientes = this.dividendos.filter(d => d.estado === 'pendiente');
    
    this.estadisticas = {
      totalDividendosPagados: dividendosPagados.length,
      totalDividendosPendientes: dividendosPendientes.length,
      montoTotalDividendos: dividendosPagados.reduce((sum, d) => sum + (d.monto_por_accion || 0), 0),
      activosConDividendos: this.activosConDividendos.length
    };
  }

  procesarDividendosAutomaticos(): void {
    if (!confirm('¿Estás seguro de que quieres procesar todos los dividendos automáticos? Esta acción verificará qué activos deben generar dividendos según su frecuencia.')) {
      return;
    }

    this.procesandoDividendos = true;
    
    // Llamar al endpoint de procesamiento automático
    this.adminService.procesarDividendosAutomaticos().subscribe({
      next: (response) => {
        this.procesandoDividendos = false;
        this.snackBar.open(response.mensaje || 'Dividendos procesados correctamente', 'Cerrar', { duration: 5000 });
        this.cargarDatos(); // Recargar datos
      },
      error: (error) => {
        this.procesandoDividendos = false;
        console.error('Error al procesar dividendos:', error);
        this.snackBar.open('Error al procesar dividendos automáticos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  mostrarFormularioGenerarDividendo(): void {
    if (this.activosConDividendos.length === 0) {
      this.snackBar.open('No hay activos configurados para pagar dividendos', 'Cerrar', { duration: 3000 });
      return;
    }
    
    this.mostrandoFormulario = true;
    this.dividendoManual = {
      activoId: this.activosConDividendos[0].id,
      montoPorAccion: 0,
      fechaPago: new Date().toISOString().split('T')[0]
    };
  }

  cancelarFormulario(): void {
    this.mostrandoFormulario = false;
  }

  generarDividendoManual(): void {
    if (!this.dividendoManual.activoId || this.dividendoManual.montoPorAccion <= 0) {
      this.snackBar.open('Por favor completa todos los campos correctamente', 'Cerrar', { duration: 3000 });
      return;
    }

    const activo = this.activos.find(a => a.id === this.dividendoManual.activoId);
    if (!activo) {
      this.snackBar.open('Activo no encontrado', 'Cerrar', { duration: 3000 });
      return;
    }

    const nuevoDividendo: Dividendo = {
      activo_id: this.dividendoManual.activoId,
      fecha: this.dividendoManual.fechaPago,
      monto_por_accion: this.dividendoManual.montoPorAccion,
      estado: 'pendiente'
    };

    this.dividendoService.crearDividendo(nuevoDividendo).subscribe({
      next: (response) => {
        this.snackBar.open(`Dividendo creado para ${activo.simbolo}`, 'Cerrar', { duration: 3000 });
        this.cancelarFormulario();
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error al crear dividendo:', error);
        this.snackBar.open('Error al crear dividendo', 'Cerrar', { duration: 3000 });
      }
    });
  }

  calcularMontoPorAccionAutomatico(): void {
    const activo = this.activos.find(a => a.id === this.dividendoManual.activoId);
    if (activo && activo.porcentajeDividendo > 0) {
      const montoPorAccion = (activo.ultimoPrecio * activo.porcentajeDividendo) / 100;
      this.dividendoManual.montoPorAccion = Math.round(montoPorAccion * 100) / 100;
    }
  }

  // Ver detalles del dividendo
  verDetallesDividendo(dividendo: Dividendo): void {
    if (!dividendo.id) {
      this.snackBar.open('ID de dividendo no válido', 'Cerrar', { duration: 3000 });
      return;
    }

    this.dividendoService.obtenerDetallesDividendo(dividendo.id).subscribe({
      next: (response) => {
        this.dividendoSeleccionado = response.dividendo;
        this.estadisticasDividendo = response.estadisticas;
        this.mostrandoDetalles = true;
      },
      error: (error) => {
        console.error('Error al obtener detalles del dividendo:', error);
        this.snackBar.open('Error al obtener detalles del dividendo', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Marcar dividendo como pagado
  marcarComoPagado(dividendo: Dividendo): void {
    if (!dividendo.id) {
      this.snackBar.open('ID de dividendo no válido', 'Cerrar', { duration: 3000 });
      return;
    }

    const activo = this.obtenerNombreActivo(dividendo.activo_id);
    if (!confirm(`¿Estás seguro de que quieres marcar como PAGADO el dividendo de ${activo}? Esta acción procesará los pagos a todos los usuarios que posean este activo.`)) {
      return;
    }

    this.dividendoService.marcarComoPagado(dividendo.id).subscribe({
      next: (response) => {
        if (response.error) {
          this.snackBar.open(response.mensaje || 'Error al marcar dividendo como pagado', 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open(response?.mensaje || 'Dividendo marcado como pagado correctamente', 'Cerrar', { duration: 5000 });
          this.cargarDatos(); // Recargar datos
        }
      },
      error: (error) => {
        console.error('Error al marcar dividendo como pagado:', error);
        this.snackBar.open('Error al marcar dividendo como pagado', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Cancelar dividendo
  cancelarDividendo(dividendo: Dividendo): void {
    if (!dividendo.id) {
      this.snackBar.open('ID de dividendo no válido', 'Cerrar', { duration: 3000 });
      return;
    }

    const activo = this.obtenerNombreActivo(dividendo.activo_id);
    if (!confirm(`¿Estás seguro de que quieres CANCELAR el dividendo de ${activo}? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.dividendoService.cancelarDividendo(dividendo.id).subscribe({
      next: (response) => {
        if (response.error) {
          this.snackBar.open(response.mensaje || 'Error al cancelar dividendo', 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open(response?.mensaje || 'Dividendo cancelado correctamente', 'Cerrar', { duration: 3000 });
          this.cargarDatos(); // Recargar datos
        }
      },
      error: (error) => {
        console.error('Error al cancelar dividendo:', error);
        this.snackBar.open('Error al cancelar dividendo', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Cerrar modal de detalles
  cerrarDetalles(): void {
    this.mostrandoDetalles = false;
    this.dividendoSeleccionado = null;
    this.estadisticasDividendo = null;
  }

  // Métodos de filtrado
  get dividendosFiltrados(): Dividendo[] {
    let filtrados = [...this.dividendos];

    if (this.filtroEstado !== 'todos') {
      filtrados = filtrados.filter(d => d.estado === this.filtroEstado);
    }

    if (this.filtroActivo !== 'todos') {
      filtrados = filtrados.filter(d => d.activo_id === parseInt(this.filtroActivo));
    }

    return filtrados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  // Métodos auxiliares
  formatearDinero(valor: number): string {
    return this.dividendoService.formatearDinero(valor);
  }

  formatearFecha(fecha: string | Date): string {
    return this.dividendoService.formatearFecha(fecha);
  }

  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'pagado': return 'bg-success';
      case 'pendiente': return 'bg-warning';
      case 'cancelado': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  obtenerNombreActivo(activoId: number): string {
    const activo = this.activos.find(a => a.id === activoId);
    return activo ? `${activo.simbolo} - ${activo.nombre}` : 'Activo desconocido';
  }

  esActivoElegibleDividendo(activo: Activo): boolean {
    if (!activo.ultimaFechaDividendo) return true;
    
    const ultimaFecha = new Date(activo.ultimaFechaDividendo);
    const hoy = new Date();
    const diasTranscurridos = Math.floor((hoy.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24));
    
    const diasRequeridos = {
      'mensual': 30,
      'trimestral': 90,
      'semestral': 180,
      'anual': 365
    };
    
    return diasTranscurridos >= (diasRequeridos[activo.frecuenciaDividendo as keyof typeof diasRequeridos] || 365);
  }
}
