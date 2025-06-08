import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DividendoService, Dividendo } from '../../services/dividendo.service';
import { AuthService } from '../../services/auth.service';
import { PortafolioService } from '../../services/portafolio.service';
import { Usuario } from '../../models/usuario.model';
import { Portafolio } from '../../models/portafolio.model';

@Component({
  selector: 'app-dividendos',
  templateUrl: './dividendos.component.html',
  styleUrls: ['./dividendos.component.css']
})
export class DividendosComponent implements OnInit {
  dividendos: Dividendo[] = [];
  usuario: Usuario | null = null;
  portafolioSeleccionado: Portafolio | null = null;
  cargando = true;
  columnasMostradas: string[] = ['fecha', 'activo', 'acciones', 'monto_por_accion', 'monto_total', 'estado'];

  constructor(
    private dividendoService: DividendoService,
    private authService: AuthService,
    private portafolioService: PortafolioService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Suscribirse al usuario actual
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
      
      // Si hay un usuario autenticado, cargar sus dividendos
      if (usuario) {
        this.cargarDividendos();
      }
    });

    // Suscribirse a cambios en el portafolio seleccionado
    this.portafolioService.portafolioActual$.subscribe(portafolio => {
      this.portafolioSeleccionado = portafolio;
    });
  }

  cargarDividendos(): void {
    this.cargando = true;
    
    console.log('🔄 Iniciando carga de dividendos del usuario...');
    console.log('👤 Usuario actual:', this.usuario);
    
    this.dividendoService.obtenerDividendosPorUsuario().subscribe({
      next: (dividendos) => {
        console.log('✅ Dividendos recibidos en componente:', dividendos);
        this.dividendos = dividendos || [];
        this.cargando = false;
        
        if (this.dividendos.length === 0) {
          console.log('ℹ️ No se encontraron dividendos para el usuario');
          this.snackBar.open(
            'No tienes dividendos registrados aún. Cuando tengas activos que generen dividendos, aparecerán aquí.',
            'Entendido',
            { duration: 4000 }
          );
        } else {
          console.log(`📊 Se cargaron ${this.dividendos.length} dividendos exitosamente`);
          // Calcular totales para mostrar información útil
          const totalDividendos = this.dividendos.reduce((sum, div) => sum + (div.montoTotal || 0), 0);
          this.snackBar.open(
            `Se cargaron ${this.dividendos.length} dividendos. Total recibido: ${this.formatearDinero(totalDividendos)}`,
            'Cerrar',
            { duration: 3000 }
          );
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar dividendos en componente:', error);
        this.cargando = false;
        this.dividendos = [];
        
        let mensaje = 'Error al cargar dividendos';
        let duracion = 5000;
        
        // Manejo específico de errores según el tipo
        if (error?.status === 401) {
          mensaje = 'Debes iniciar sesión para ver tus dividendos';
          duracion = 4000;
        } else if (error?.status === 403) {
          mensaje = 'No tienes permisos para acceder a esta información';
          duracion = 4000;
        } else if (error?.status === 400) {
          mensaje = 'Error en la solicitud. Por favor, recarga la página e inicia sesión nuevamente.';
          duracion = 6000;
        } else if (error?.status === 500) {
          mensaje = 'Error del servidor. Por favor, inténtalo más tarde.';
          duracion = 6000;
        } else if (error?.error) {
          // Si tenemos información detallada del error
          if (typeof error.error === 'string') {
            mensaje = error.error;
          } else if (error.error.mensaje) {
            mensaje = error.error.mensaje;
          } else if (error.error.error) {
            mensaje = error.error.error;
          }
        }
        
        this.snackBar.open(mensaje, 'Cerrar', { 
          duration: duracion,
          panelClass: ['error-snackbar']
        });

        // Intentar método alternativo si el error es 400
        if (error?.status === 400) {
          console.log('🔄 Intentando método alternativo...');
          this.cargarDividendosAlternativo();
        }
      }
    });
  }

  private cargarDividendosAlternativo(): void {
    console.log('🔄 Método alternativo de carga...');
    
    this.dividendoService.obtenerDividendosSimple().subscribe({
      next: (dividendos) => {
        console.log('✅ Dividendos obtenidos por método alternativo:', dividendos);
        this.dividendos = dividendos || [];
        
        if (this.dividendos.length > 0) {
          this.snackBar.open(
            `Dividendos cargados correctamente (${this.dividendos.length})`,
            'Cerrar',
            { duration: 3000 }
          );
        }
      },
      error: (error) => {
        console.error('❌ Error también en método alternativo:', error);
        this.snackBar.open(
          'Error persistente al cargar dividendos. Contacta al soporte técnico.',
          'Cerrar',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  // Método para formatear valores monetarios
  formatearDinero(valor: number): string {
    return this.dividendoService.formatearDinero(valor);
  }

  // Método para formatear fechas
  formatearFecha(fecha: string | Date): string {
    return this.dividendoService.formatearFecha(fecha);
  }

  // Método para determinar la clase CSS según el estado del dividendo
  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'pagado': return 'estado-pagado';
      case 'pendiente': return 'estado-pendiente';
      case 'cancelado': return 'estado-cancelado';
      default: return '';
    }
  }
}