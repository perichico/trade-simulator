import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MercadoComponent } from './components/mercado/mercado.component';
import { HistorialComponent } from './components/historial/historial.component';
import { DetalleActivoComponent } from './components/detalle-activo/detalle-activo.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'mercado', component: MercadoComponent, canActivate: [AuthGuard] },
  { path: 'historial', component: HistorialComponent, canActivate: [AuthGuard] },
  { path: 'detalle-activo/:id', component: DetalleActivoComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }