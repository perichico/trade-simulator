import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <mat-toolbar color="primary">
      <span>Simulador de Trading</span>
      <span class="spacer"></span>
      <button mat-button routerLink="/login">Iniciar Sesión</button>
      <button mat-button routerLink="/registro">Registrarse</button>
    </mat-toolbar>

    <div class="content-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    .content-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class AppComponent {
  title = 'Simulador de Trading';
}