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
    console.log('AdminService disponible:', !!this.adminService);
    console.log('Método obtenerUsuarios disponible:', typeof this.adminService.obtenerUsuarios);
    
    this.adminService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        console.log('=== RESPUESTA DEL SERVIDOR ===');
        console.log('Usuarios recibidos del servidor:', usuarios);
        console.log('Tipo de datos recibidos:', typeof usuarios);
        console.log('Es un array?', Array.isArray(usuarios));
        console.log('Cantidad de usuarios:', usuarios?.length || 0);
        console.log('Primer usuario (si existe):', usuarios?.[0]);
        console.log('================================');
        
        this.usuarios = Array.isArray(usuarios) ? usuarios : [];
        console.log('Usuarios asignados al componente:', this.usuarios);
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.log('=== ERROR EN CARGA DE USUARIOS ===');
        console.error('Error completo:', error);
        console.error('Status del error:', error.status);
        console.error('Message del error:', error.message);
        console.error('Error.error:', error.error);
        console.error('Headers:', error.headers);
        console.error('URL:', error.url);
        console.log('===================================');
        
        this.usuarios = []; // Asegurar que sea un array vacío
        this.usuariosFiltrados = [];
        this.snackBar.open(`Error al cargar usuarios: ${error.error?.error || error.message}`, 'Cerrar', { duration: 5000 });
        this.cargando = false;
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
          return usuario.activo !== false;
        } else {
          return usuario.activo === false;
        }
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
    const nuevoEstado = !usuario.activo;
    this.adminService.toggleEstadoUsuario(usuario.id, nuevoEstado).subscribe({
      next: (response) => {
        usuario.activo = nuevoEstado;
        console.log('Estado cambiado:', response);
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
      }
    });
  }

  confirmarEliminarUsuario(usuario: Usuario): void {
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${usuario.nombre}?`)) {
      this.eliminarUsuario(usuario);
    }
  }

  private eliminarUsuario(usuario: Usuario): void {
    this.adminService.eliminarUsuario(usuario.id).subscribe({
      next: (response) => {
        this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
        this.aplicarFiltros();
        console.log('Usuario eliminado:', response);
      },
      error: (error) => {
        console.error('Error al eliminar usuario:', error);
      }
    });
  }

  // Métodos para las estadísticas
  obtenerTotalUsuarios(): number {
    return this.estadisticas?.totalUsuarios || this.usuarios.length;
  }

  obtenerUsuariosActivos(): number {
    return this.estadisticas?.usuariosActivos || this.usuarios.filter(u => u.activo !== false).length;
  }

  obtenerAdministradores(): number {
    return this.estadisticas?.administradores || this.usuarios.filter(u => u.rol === 'admin').length;
  }

  obtenerUsuariosHoy(): number {
    return this.estadisticas?.usuariosHoy || 0;
  }

  // Métodos de utilidad
  obtenerClaseEstado(activo: boolean): string {
    return activo !== false ? 'badge bg-success' : 'badge bg-danger';
  }

  obtenerTextoEstado(activo: boolean): string {
    return activo !== false ? 'Activo' : 'Inactivo';
  }

  formatearFecha(fecha: string | Date): string {
    return new Date(fecha).toLocaleDateString('es-ES');
  }
}
