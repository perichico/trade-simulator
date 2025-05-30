import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.css']
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  estadisticas: any = null;
  cargando = false;
  
  // Filtros
  filtroTexto = '';
  filtroRol = 'todos';
  filtroEstado = 'todos';

  // Configuración de tabla
  columnasMostradas: string[] = ['id', 'nombre', 'email', 'rol', 'estado', 'fechaRegistro', 'acciones'];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log('=== INICIANDO AdminUsuariosComponent ===');
    
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
    this.cargarUsuarios();
    this.cargarEstadisticas();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    console.log('Iniciando carga de usuarios...');
    
    this.adminService.obtenerUsuarios().subscribe({
      next: (respuesta: any) => {
        console.log('=== RESPUESTA DEL SERVIDOR ===');
        console.log('Respuesta completa:', respuesta);
        
        // Manejar tanto array directo como objeto con propiedad usuarios
        let usuarios: Usuario[];
        if (Array.isArray(respuesta)) {
          usuarios = respuesta;
        } else if (respuesta && respuesta.usuarios && Array.isArray(respuesta.usuarios)) {
          usuarios = respuesta.usuarios;
        } else {
          console.error('Formato de respuesta inesperado:', respuesta);
          usuarios = [];
        }
        
        console.log('Usuarios extraídos:', usuarios);
        console.log('Cantidad de usuarios:', usuarios.length);
        
        this.usuarios = usuarios;
        this.aplicarFiltros();
        this.cargando = false;
        
        // Mostrar mensaje si no hay usuarios
        if (usuarios.length === 0) {
          this.snackBar.open('No hay usuarios registrados en el sistema', 'Cerrar', { duration: 5000 });
        }
      },
      error: (error) => {
        console.log('=== ERROR EN CARGA DE USUARIOS ===');
        console.error('Error completo:', error);
        
        this.usuarios = [];
        this.usuariosFiltrados = [];
        this.cargando = false;
        
        if (error.status === 401) {
          this.snackBar.open('Sesión expirada. Redirigiendo al login...', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          this.snackBar.open('No tienes permisos de administrador', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        } else {
          this.snackBar.open(`Error al cargar usuarios: ${error.error?.error || error.message}`, 'Cerrar', { duration: 5000 });
        }
      }
    });
  }

  cargarEstadisticas(): void {
    console.log('Iniciando carga de estadísticas...');
    console.log('Cookie del navegador:', document.cookie);
    
    this.adminService.obtenerEstadisticas().subscribe({
      next: (stats) => {
        console.log('Estadísticas recibidas:', stats);
        this.estadisticas = stats;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        console.error('Detalles del error:', error.error);
        console.error('Status del error:', error.status);
        this.snackBar.open(`Error al cargar estadísticas: ${error.error?.error || error.message}`, 'Cerrar', { duration: 5000 });
        // Mantener estadísticas como null para que no se muestren
        this.estadisticas = null;
      }
    });
  }

  aplicarFiltros(): void {
    console.log('Aplicando filtros...');
    console.log('Usuarios base:', this.usuarios);
    console.log('Filtro texto:', this.filtroTexto);
    console.log('Filtro rol:', this.filtroRol);
    console.log('Filtro estado:', this.filtroEstado);
    
    let filtrados = [...this.usuarios];
    console.log('Usuarios después de spread:', filtrados);

    // Filtro por texto
    if (this.filtroTexto.trim()) {
      const texto = this.filtroTexto.toLowerCase();
      filtrados = filtrados.filter(usuario => 
        usuario.nombre?.toLowerCase().includes(texto) ||
        usuario.email?.toLowerCase().includes(texto)
      );
    }

    // Filtro por rol
    if (this.filtroRol !== 'todos') {
      filtrados = filtrados.filter(usuario => usuario.rol === this.filtroRol);
    }

    // Filtro por estado
    if (this.filtroEstado !== 'todos') {
      filtrados = filtrados.filter(usuario => {
        if (this.filtroEstado === 'activos') {
          return usuario.estado === 'activo';
        } else if (this.filtroEstado === 'suspendidos') {
          return usuario.estado === 'suspendido';
        }
        return true;
      });
    }

    console.log('Usuarios filtrados:', filtrados);
    this.usuariosFiltrados = filtrados;
  }

  cambiarRol(usuario: Usuario, nuevoRol: 'usuario' | 'admin'): void {
    this.adminService.cambiarRolUsuario(usuario.id, nuevoRol).subscribe({
      next: (response) => {
        usuario.rol = nuevoRol;
        console.log('Rol cambiado:', response);
      },
      error: (error) => {
        console.error('Error al cambiar rol:', error);
      }
    });
  }

  toggleEstadoUsuario(usuario: Usuario): void {
    const nuevoEstado = usuario.estado === 'activo' ? 'suspendido' : 'activo';
    this.adminService.cambiarEstadoUsuario(usuario.id, nuevoEstado).subscribe({
      next: (response) => {
        usuario.estado = nuevoEstado;
        console.log('Estado cambiado:', response);
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
      }
    });
  }

  suspenderUsuario(usuario: Usuario): void {
    const nuevoEstado = usuario.estado === 'activo' ? 'suspendido' : 'activo';
    const accion = nuevoEstado === 'suspendido' ? 'suspender' : 'activar';
    
    if (confirm(`¿Estás seguro de que quieres ${accion} al usuario ${usuario.nombre}?`)) {
      this.adminService.cambiarEstadoUsuario(usuario.id, nuevoEstado).subscribe({
        next: (response) => {
          usuario.estado = nuevoEstado;
          this.snackBar.open(`Usuario ${accion}do correctamente`, 'Cerrar', { duration: 3000 });
          console.log('Estado cambiado:', response);
        },
        error: (error) => {
          console.error('Error al cambiar estado:', error);
          this.snackBar.open(`Error al ${accion} usuario`, 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  confirmarEliminarUsuario(usuario: Usuario): void {
    if (confirm(`¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE al usuario ${usuario.nombre}? Esta acción no se puede deshacer.`)) {
      this.eliminarUsuario(usuario);
    }
  }

  private eliminarUsuario(usuario: Usuario): void {
    this.adminService.eliminarUsuario(usuario.id).subscribe({
      next: (response) => {
        this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
        this.aplicarFiltros();
        this.snackBar.open('Usuario eliminado correctamente', 'Cerrar', { duration: 3000 });
        console.log('Usuario eliminado:', response);
      },
      error: (error) => {
        console.error('Error al eliminar usuario:', error);
        this.snackBar.open('Error al eliminar usuario', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Métodos de estadísticas
  obtenerTotalUsuarios(): number {
    return this.usuarios.length;
  }

  obtenerUsuariosActivos(): number {
    return this.usuarios.filter(u => u.estado === 'activo').length;
  }

  obtenerUsuariosSuspendidos(): number {
    return this.usuarios.filter(u => u.estado === 'suspendido').length;
  }

  obtenerUsuariosHoy(): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return this.usuarios.filter(u => {
      const fechaRegistro = new Date(u.fechaRegistro);
      fechaRegistro.setHours(0, 0, 0, 0);
      return fechaRegistro.getTime() === hoy.getTime();
    }).length;
  }

  // Métodos auxiliares
  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'activo':
        return 'badge bg-success';
      case 'suspendido':
        return 'badge bg-warning';
      default:
        return 'badge bg-secondary';
    }
  }

  obtenerTextoEstado(estado: string): string {
    switch (estado) {
      case 'activo':
        return 'Activo';
      case 'suspendido':
        return 'Suspendido';
      default:
        return 'Desconocido';
    }
  }

  formatearFecha(fecha: string | Date): string {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}
