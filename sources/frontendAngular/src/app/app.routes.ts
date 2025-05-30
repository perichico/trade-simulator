import { Routes } from '@angular/router';
import { UsuarioSuspendidoGuard } from './guards/usuario-suspendido.guard';

export const routes: Routes = [
  // ...existing routes...
  {
    path: 'usuario-suspendido',
    loadComponent: () => import('./components/usuario-suspendido/usuario-suspendido.component').then(m => m.UsuarioSuspendidoComponent)
  },
  // Aplicar el guard a rutas protegidas
  {
    path: 'dashboard',
    canActivate: [UsuarioSuspendidoGuard],
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  // Agregar el guard a otras rutas protegidas según sea necesario
  // ...existing routes...
];