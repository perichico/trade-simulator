import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { TransaccionService } from '../../services/transaccion.service';
import { PortafolioService } from '../../services/portafolio.service';
import { Usuario } from '../../models/usuario.model';
import { Transaccion } from '../../models/transaccion.model';
import { Portafolio } from '../../models/portafolio.model';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent implements OnInit {
  usuario: Usuario | null = null;
  portafolioSeleccionado: Portafolio | null = null;
  private transaccionesSubject = new BehaviorSubject<Transaccion[]>([]);
  transacciones$ = this.transaccionesSubject.asObservable();
  columnasMostradas: string[] = ['fecha', 'activo', 'tipo', 'cantidad', 'precio', 'total'];
  cargando = true;

  constructor(
    private authService: AuthService,
    private transaccionService: TransaccionService,
    private portafolioService: PortafolioService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Suscribirse al usuario actual
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
      
      // Si hay un usuario autenticado, cargar sus transacciones y portafolio
      if (usuario) {
        this.cargarTransacciones();
        this.cargarPortafolioSeleccionado();
      }
    });

    // Suscribirse a cambios en el portafolio seleccionado
    this.portafolioService.portafolioActual$.subscribe(portafolio => {
      this.portafolioSeleccionado = portafolio;
    });
  }

  cargarTransacciones(): void {
    this.cargando = true;
    if (this.usuario) {
      // Usar el método correcto que no requiere usuarioId como parámetro
      this.transaccionService.obtenerTransaccionesUsuario().subscribe({
        next: (transacciones) => {
          this.transaccionesSubject.next(transacciones);
          this.cargando = false;
          
          if (transacciones.length === 0) {
            console.log('No se encontraron transacciones para el usuario');
          }
        },
        error: (error) => {
          this.cargando = false;
          console.error('Error al cargar transacciones:', error);
          
          // Mostrar mensaje más amigable para el usuario
          if (error.status === 404) {
            // No mostrar error para 404, solo log
            console.log('No hay transacciones disponibles');
            this.transaccionesSubject.next([]);
          } else {
            this.snackBar.open(
              `Error al cargar transacciones: ${error.error?.error || 'Error de conexión'}`,
              'Cerrar',
              { duration: 5000 }
            );
          }
        }
      });
    }
  }

  // Cargar el portafolio seleccionado
  cargarPortafolioSeleccionado(): void {
    this.portafolioService.obtenerPortafolioActual().subscribe(portafolio => {
      this.portafolioSeleccionado = portafolio;
    });
  }

  // Método para formatear valores monetarios
  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor || 0);
  }

  // Método para formatear fechas
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Método para determinar la clase CSS según el tipo de transacción
  obtenerClaseTipo(tipo: string): string {
    return tipo === 'compra' ? 'compra-row' : 'venta-row';
  }
}