import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subscription, interval } from 'rxjs';
import { startWith, switchMap, map } from 'rxjs/operators';
import { Activo } from '../../models/activo.model';
import { Usuario } from '../../models/usuario.model';
import { Portafolio } from '../../models/portafolio.model';
import { ActivoService } from '../../services/activo.service';
import { AuthService } from '../../services/auth.service';
import { TransaccionService } from '../../services/transaccion.service';
import { PortafolioService } from '../../services/portafolio.service';
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
  portafolioActual: Portafolio | null = null;
  columnasMostradas: string[] = ['simbolo', 'nombre', 'precio', 'variacion'];

  tiposActivo = [
    { id: 0, nombre: 'Todos' },
    { id: 1, nombre: 'Acciones' },
    { id: 2, nombre: 'Bonos' },
    { id: 3, nombre: 'ETF' },
    { id: 4, nombre: 'Criptomonedas' },
    { id: 5, nombre: 'Materias Primas' },
    { id: 6, nombre: 'Divisas' }
  ];

  tipoSeleccionado: number = 0;

  get columnasCompletas(): string[] {
    return this.usuario ? [...this.columnasMostradas, 'acciones'] : this.columnasMostradas;
  }
  actualizacionSubscription!: Subscription;
  
  constructor(
    private activoService: ActivoService,
    private authService: AuthService,
    private transaccionService: TransaccionService,
    private portafolioService: PortafolioService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public router: Router
  ) { }

  ngOnInit(): void {
    // Obtener usuario actual
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
    });

    // Obtener portafolio actual
    this.portafolioService.portafolioActual$.subscribe(portafolio => {
      this.portafolioActual = portafolio;
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

  // Método para trackear activos en ngFor para mejor rendimiento
  trackByActivoId(index: number, activo: Activo): number {
    return activo.id;
  }

  // Método para navegar al detalle del activo
  navegarADetalle(activoId: number): void {
    console.log('Navegando a detalle del activo ID:', activoId);
    
    // Validar que el ID sea válido antes de navegar
    if (!activoId || isNaN(activoId) || activoId <= 0) {
      console.error('ID de activo inválido para navegación:', activoId);
      this.snackBar.open('Error: ID de activo inválido', 'Cerrar', {
        duration: 3000
      });
      return;
    }
    
    this.router.navigate(['/detalle-activo', activoId]);
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
      // Usar el método de navegación validado
      this.navegarADetalle(activo.id);
      return;
    }

    const dialogRef = this.dialog.open(TransaccionDialogComponent, {
      width: '400px',
      data: {
        activo,
        tipo,
        balanceUsuario: this.portafolioActual?.saldo || 0
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
    // Usar el portafolio actual que ya está disponible como propiedad del componente
    const portafolioId = this.portafolioActual?.id;
    this.transaccionService.crearTransaccion(activoId, tipo, cantidad, portafolioId)
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

  // Método para formatear valores monetarios
  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor);
  }

  // Método para actualizar los activos filtrados
  private actualizarActivosFiltrados(): void {
    this.activosFiltrados$ = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.activoService.obtenerActivos(this.tipoSeleccionado === 0 ? undefined : this.tipoSeleccionado))
    );
  }

  // Método para cambiar el tipo de activo seleccionado
  cambiarTipoActivo(tipo: number): void {
    this.tipoSeleccionado = tipo;
    this.actualizarActivosFiltrados();
  }
}