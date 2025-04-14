import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { Activo } from '../../models/activo.model';
import { Usuario } from '../../models/usuario.model';
import { ActivoService } from '../../services/activo.service';
import { AuthService } from '../../services/auth.service';
import { TransaccionDialogComponent } from '../transaccion-dialog/transaccion-dialog.component';
import { TransaccionService } from '../../services/transaccion.service';

@Component({
  selector: 'app-detalle-activo',
  templateUrl: './detalle-activo.component.html',
  styleUrls: ['./detalle-activo.component.css']
})
export class DetalleActivoComponent implements OnInit, OnDestroy {
  activoId!: number;
  activo$!: Observable<Activo>;
  usuario: Usuario | null = null;
  cargando = true;
  error = false;
  actualizacionSubscription!: Subscription;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activoService: ActivoService,
    private authService: AuthService,
    private transaccionService: TransaccionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Obtener el ID del activo de la URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.activoId = +id;
        this.cargarActivo();
      } else {
        this.error = true;
        this.cargando = false;
      }
    });

    // Obtener usuario actual
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
    });
  }

  ngOnDestroy(): void {
    if (this.actualizacionSubscription) {
      this.actualizacionSubscription.unsubscribe();
    }
  }

  cargarActivo(): void {
    // Cargar activo y actualizar cada 10 segundos
    this.activo$ = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.activoService.obtenerActivoPorId(this.activoId))
    );

    // Suscribirse para detectar cuando termina la carga
    this.actualizacionSubscription = this.activo$.subscribe({
      next: () => {
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.error = true;
        this.snackBar.open(
          `Error al cargar el activo: ${error.error?.error || 'Error desconocido'}`,
          'Cerrar',
          { duration: 5000 }
        );
      }
    });
  }

  // Método para abrir el diálogo de transacción
  abrirDialogoTransaccion(activo: Activo, tipo: 'compra' | 'venta'): void {
    if (!this.usuario) {
      this.snackBar.open('Debes iniciar sesión para realizar transacciones', 'Cerrar', {
        duration: 3000
      });
      return;
    }

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
          
          // Actualizar el balance del usuario
          this.authService.verificarSesion();
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

  // Método para formatear valores monetarios
  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor);
  }

  // Método para obtener la clase CSS según la variación
  obtenerClaseVariacion(variacion: number): string {
    if (variacion > 0) return 'variacion-positiva';
    if (variacion < 0) return 'variacion-negativa';
    return 'variacion-neutral';
  }

  // Método para obtener el icono según la tendencia
  obtenerIconoTendencia(tendencia: string): string {
    switch (tendencia) {
      case 'alza': return 'trending_up';
      case 'baja': return 'trending_down';
      default: return 'trending_flat';
    }
  }
}