import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subscription, interval, of } from 'rxjs';
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
  activo: Activo | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activoService: ActivoService,
    private authService: AuthService,
    private transaccionService: TransaccionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
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
    this.activo$ = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.activoService.obtenerActivoPorId(this.activoId))
    );

    this.actualizacionSubscription = this.activo$.subscribe({
      next: (activo) => {
        this.activo = activo;
        this.cargando = false;
        this.error = false;
      },
      error: (error) => {
        console.error('Error al cargar el activo:', error);
        this.cargando = false;
        this.error = true;

        const mensaje =
          error?.error?.error ||
          error?.message ||
          'Error desconocido';

        this.snackBar.open(`Error al cargar el activo: ${mensaje}`, 'Cerrar', {
          duration: 5000
        });
      }
    });
  }

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

  realizarTransaccion(activoId: number, tipo: 'compra' | 'venta', cantidad: number): void {
    this.transaccionService.crearTransaccion(activoId, tipo, cantidad)
      .subscribe({
        next: () => {
          this.snackBar.open(
            `Transacción de ${tipo} realizada con éxito`,
            'Cerrar',
            { duration: 3000 }
          );
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

  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor);
  }

  obtenerClaseVariacion(variacion: number): string {
    if (variacion > 0) return 'variacion-positiva';
    if (variacion < 0) return 'variacion-negativa';
    return 'variacion-neutral';
  }

  obtenerIconoTendencia(tendencia: string | undefined): string {
    switch (tendencia) {
      case 'alza': return 'trending_up';
      case 'baja': return 'trending_down';
      default: return 'trending_flat';
    }
  }
}
