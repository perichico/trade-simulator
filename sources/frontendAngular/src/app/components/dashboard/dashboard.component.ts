import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { Usuario } from '../../models/usuario.model';
import { Portafolio } from '../../models/portafolio.model';
import { Activo } from '../../models/activo.model';
import { TransaccionDialogComponent } from '../transaccion-dialog/transaccion-dialog.component';
import { TransaccionService } from '../../services/transaccion.service';
import { AuthService } from '../../services/auth.service';
import { PortafolioService } from '../../services/portafolio.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  usuario: Usuario | null = null;
  portafolio$: Observable<Portafolio> | null = null;
  actualizacionSubscription!: Subscription;
  now: Date = new Date();
  
  constructor(
    private authService: AuthService,
    private portafolioService: PortafolioService,
    private transaccionService: TransaccionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Suscribirse al usuario actual
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
      
      // Si hay un usuario autenticado, cargar su portafolio
      if (usuario) {
        this.cargarPortafolio(usuario.id);
      } else {
        this.router.navigate(['/login']);
      }
    });

    // Actualizar la hora cada minuto
    setInterval(() => {
      this.now = new Date();
    }, 60000);
  }

  // Método para formatear valores monetarios
  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor);
  }

  // Método para determinar la clase CSS según el valor (positivo/negativo)
  obtenerClaseValor(valor: number): string {
    return valor >= 0 ? 'positive-value' : 'negative-value';
  }

  // Método para cargar y actualizar el portafolio
  cargarPortafolio(usuarioId: number): void {
    this.portafolio$ = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.portafolioService.obtenerPortafolio(usuarioId))
    );
  }

  // Método para cerrar sesión
  cerrarSesion(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  // Método para convertir ActivoEnPortafolio a Activo
  private convertirAActivo(activoPortafolio: any): Activo {
    return {
      id: activoPortafolio.activoId,
      nombre: activoPortafolio.nombre,
      simbolo: activoPortafolio.simbolo,
      ultimo_precio: activoPortafolio.precioActual
    };
  }

  // Método para abrir el diálogo de transacción
  abrirDialogoTransaccion(activoPortafolio: any, tipo: 'compra' | 'venta'): void {
    if (!this.usuario) {
      this.snackBar.open('Debes iniciar sesión para realizar transacciones', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    const activo = this.convertirAActivo(activoPortafolio);
    const dialogRef = this.dialog.open(TransaccionDialogComponent, {
      width: '400px',
      data: {
        activo,
        tipo,
        balanceUsuario: this.usuario.balance
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.realizarTransaccion(activo.id, tipo, result.cantidad);
      }
    });
  }

  // Método para realizar la transacción
  realizarTransaccion(activoId: number, tipo: 'compra' | 'venta', cantidad: number): void {
    this.transaccionService.crearTransaccion(activoId, tipo, cantidad)
      .subscribe({
        next: (respuesta) => {
          this.snackBar.open(
            `Transacción de ${tipo} realizada con éxito`, 
            'Cerrar', 
            { duration: 3000 }
          );
          
          // Actualizar el balance del usuario y el portafolio
          this.authService.verificarSesion();
          if (this.usuario) {
            this.cargarPortafolio(this.usuario.id);
          }
        },
        error: (error) => {
          this.snackBar.open(
            `Error al realizar la transacción: ${error.error?.error || 'Error desconocido'}`, 
            'Cerrar', 
            { duration: 5000 }
          );
        }
      });
  }

  ngOnDestroy(): void {
    if (this.actualizacionSubscription) {
      this.actualizacionSubscription.unsubscribe();
    }
  }
}