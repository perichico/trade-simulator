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
    this.dividendoService.obtenerDividendosPorUsuario().subscribe({
      next: (dividendos) => {
        this.dividendos = dividendos;
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.snackBar.open(
          `Error al cargar dividendos: ${error.error?.error || 'Error desconocido'}`,
          'Cerrar',
          { duration: 5000 }
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