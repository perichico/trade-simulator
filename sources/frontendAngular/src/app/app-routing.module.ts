import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlertasComponent } from './components/alertas/alertas.component';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MercadoComponent } from './components/mercado/mercado.component';
import { HistorialComponent } from './components/historial/historial.component';
import { DetalleActivoComponent } from './components/detalle-activo/detalle-activo.component';
import { DividendosComponent } from './components/dividendos/dividendos.component';
import { TransaccionComponent } from './components/transaccion/transaccion.component';
import { AdministradorComponent } from './components/administrador/administrador.component';
import { AdminUsuariosComponent } from './components/admin-usuarios/admin-usuarios.component';

const routes: Routes = [
  { path: 'alertas', component: AlertasComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'mercado', component: MercadoComponent, canActivate: [AuthGuard] },
  { path: 'historial', component: HistorialComponent, canActivate: [AuthGuard] },
  { path: 'detalle-activo/:id', component: DetalleActivoComponent, canActivate: [AuthGuard] },
  { path: 'dividendos', component: DividendosComponent },
  {
    path: 'transaccion',
    component: TransaccionComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'administrador',
    component: AdministradorComponent,
    canActivate: [AuthGuard],
    data: { requiereAdmin: true }
  },
  {
    path: 'admin/usuarios',
    loadComponent: () => import('./components/admin-usuarios/admin-usuarios.component').then(m => m.AdminUsuariosComponent),
    canActivate: [AuthGuard],
    data: { requiereAdmin: true }
  },
  { 
    path: 'admin-usuarios', 
    component: AdminUsuariosComponent,
    canActivate: [AuthGuard],
    data: { requiereAdmin: true }
  },
  {
    path: 'usuario-suspendido',
    loadComponent: () => import('./components/usuario-suspendido/usuario-suspendido.component').then(m => m.UsuarioSuspendidoComponent)
  },
  {
    path: 'admin/activos',
    loadComponent: () => import('./components/admin-activos/admin-activos.component').then(m => m.AdminActivosComponent),
    canActivate: [AuthGuard],
    data: { requiereAdmin: true }
  },
  { 
    path: 'admin-activos', 
    loadComponent: () => import('./components/admin-activos/admin-activos.component').then(m => m.AdminActivosComponent),
    canActivate: [AuthGuard],
    data: { requiereAdmin: true }
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }