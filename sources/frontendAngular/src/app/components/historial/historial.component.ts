import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { TransaccionService } from '../../services/transaccion.service';
import { Usuario } from '../../models/usuario.model';
import { Transaccion } from '../../models/transaccion.model';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent implements OnInit {
  usuario: Usuario | null = null;
  private transaccionesSubject = new BehaviorSubject<Transaccion[]>([]);
  transacciones$ = this.transaccionesSubject.asObservable();
  columnasMostradas: string[] = ['fecha', 'activo', 'tipo', 'cantidad', 'precio', 'total'];
  cargando = true;

  constructor(
    private authService: AuthService,
    private transaccionService: TransaccionService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Suscribirse al usuario actual
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
      
      // Si hay un usuario autenticado, cargar sus transacciones
      if (usuario) {
        this.cargarTransacciones();
      }
    });
  }

  cargarTransacciones(): void {
    this.cargando = true;
    if (this.usuario) {
      this.transaccionService.obtenerTransaccionesPorUsuario(this.usuario.id).subscribe({
        next: (transacciones) => {
          this.transaccionesSubject.next(transacciones);
          this.cargando = false;
        },
        error: (error) => {
          this.cargando = false;
          this.snackBar.open(
            `Error al cargar transacciones: ${error.error?.error || 'Error desconocido'}`,
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
    }
  }

  // Método para formatear valores monetarios
  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor);
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