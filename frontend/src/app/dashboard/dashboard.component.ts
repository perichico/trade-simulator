import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  balance: number;
}

interface Activo {
  id: number;
  nombre: string;
  simbolo: string;
  precio: number;
  cantidad: number;
}

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard-container">
      <mat-card class="balance-card">
        <mat-card-header>
          <mat-card-title>Balance</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <h2>{{ usuario?.balance | currency:'USD' }}</h2>
        </mat-card-content>
      </mat-card>

      <mat-card class="portfolio-card">
        <mat-card-header>
          <mat-card-title>Mi Portafolio</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="activos" class="mat-elevation-z8">
            <ng-container matColumnDef="simbolo">
              <th mat-header-cell *matHeaderCellDef> Símbolo </th>
              <td mat-cell *matCellDef="let activo"> {{activo.simbolo}} </td>
            </ng-container>

            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef> Nombre </th>
              <td mat-cell *matCellDef="let activo"> {{activo.nombre}} </td>
            </ng-container>

            <ng-container matColumnDef="cantidad">
              <th mat-header-cell *matHeaderCellDef> Cantidad </th>
              <td mat-cell *matCellDef="let activo"> {{activo.cantidad}} </td>
            </ng-container>

            <ng-container matColumnDef="precio">
              <th mat-header-cell *matHeaderCellDef> Precio Actual </th>
              <td mat-cell *matCellDef="let activo"> {{activo.precio | currency:'USD'}} </td>
            </ng-container>

            <ng-container matColumnDef="valor">
              <th mat-header-cell *matHeaderCellDef> Valor Total </th>
              <td mat-cell *matCellDef="let activo"> {{activo.precio * activo.cantidad | currency:'USD'}} </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }
    .balance-card {
      grid-column: 1 / -1;
    }
    .portfolio-card {
      grid-column: 1 / -1;
    }
    table {
      width: 100%;
    }
    .mat-column-simbolo {
      width: 100px;
    }
    .mat-column-nombre {
      flex: 1;
    }
    .mat-column-cantidad,
    .mat-column-precio,
    .mat-column-valor {
      width: 150px;
      text-align: right;
    }
  `]
})
export class DashboardComponent implements OnInit {
  usuario: Usuario | null = null;
  activos: Activo[] = [];
  displayedColumns: string[] = ['simbolo', 'nombre', 'cantidad', 'precio', 'valor'];

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.cargarDatosUsuario();
    this.cargarPortafolio();
  }

  cargarDatosUsuario() {
    this.http.get<Usuario>('http://localhost:3000/dashboard')
      .subscribe({
        next: (data) => {
          this.usuario = data;
        },
        error: (error) => {
          this.snackBar.open('Error al cargar datos del usuario', 'Cerrar', { duration: 3000 });
        }
      });
  }

  cargarPortafolio() {
    this.http.get<Activo[]>('http://localhost:3000/activos')
      .subscribe({
        next: (data) => {
          this.activos = data;
        },
        error: (error) => {
          this.snackBar.open('Error al cargar el portafolio', 'Cerrar', { duration: 3000 });
        }
      });
  }
}