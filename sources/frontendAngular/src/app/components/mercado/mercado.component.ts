import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subscription, interval } from 'rxjs';
import { startWith, switchMap, map } from 'rxjs/operators';
import { Activo } from '../../models/activo.model';
import { Usuario } from '../../models/usuario.model';
import { ActivoService } from '../../services/activo.service';
import { AuthService } from '../../services/auth.service';
import { TransaccionService } from '../../services/transaccion.service';
import { TransaccionDialogComponent } from '../transaccion-dialog/transaccion-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mercado',
  templateUrl: './mercado.component.html',
  styleUrls: ['./mercado.component.css']
})
export class MercadoComponent implements OnInit, OnDestroy {
  activos$!: Observable<Activo[]>;
  activosFiltrados$!: Observable<Activo[]>;
  usuario: Usuario | null = null;
  columnasMostradas: string[] = ['simbolo', 'nombre', 'precio', 'variacion'];
  tipoSeleccionado: string = 'todos';
  tiposActivo = [
    { valor: 'todos', nombre: 'Todos' },
    { valor: 'accion', nombre: 'Acciones' },
    { valor: 'criptomoneda', nombre: 'Criptomonedas' },
    { valor: 'materia_prima', nombre: 'Materias Primas' },
    { valor: 'divisa', nombre: 'Divisas' }
  ];

  get columnasCompletas(): string[] {
    return this.usuario ? [...this.columnasMostradas, 'acciones'] : this.columnasMostradas;
  }
  actualizacionSubscription!: Subscription;
  
  constructor(
    private activoService: ActivoService,
    private authService: AuthService,
    private transaccionService: TransaccionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Obtener usuario actual
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
    });

    // Cargar activos y actualizar cada 10 segundos
    this.activos$ = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.activoService.obtenerActivos())
    );

    // Inicializar los activos filtrados
    this.actualizarActivosFiltrados();
  }

  ngOnDestroy(): void {
    if (this.actualizacionSubscription) {
      this.actualizacionSubscription.unsubscribe();
    }
  }

  // Método para abrir el diálogo de transacción
  abrirDialogoTransaccion(activo: Activo, tipo: 'compra' | 'venta'): void {
    if (!this.usuario) {
      this.snackBar.open('Debes iniciar sesión para realizar transacciones', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    if (tipo === 'compra') {
      this.router.navigate(['/detalle-activo', activo.id]);
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

  // Método para obtener la clase CSS según la variación
  obtenerClaseVariacion(variacion: number): string {
    return variacion > 0 ? 'positive-value' : variacion < 0 ? 'negative-value' : '';
  }

  // Método para obtener el icono según la tendencia
  obtenerIconoTendencia(tendencia: string): string {
    switch (tendencia) {
      case 'alza': return 'trending_up';
      case 'baja': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  // Método para formatear valores monetarios
  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor);
  }

  // Método para actualizar los activos filtrados
  private actualizarActivosFiltrados(): void {
    this.activosFiltrados$ = this.activos$.pipe(
      map(activos => {
        if (this.tipoSeleccionado === 'todos') {
          return activos;
        }
        return activos.filter(activo => activo.tipo === this.tipoSeleccionado);
      })
    );
  }

  // Método para cambiar el tipo de activo seleccionado
  cambiarTipoActivo(tipo: string): void {
    this.tipoSeleccionado = tipo;
    this.actualizarActivosFiltrados();
  }
}