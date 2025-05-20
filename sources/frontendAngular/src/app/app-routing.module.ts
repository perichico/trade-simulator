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

const routes: Routes = [
  { path: 'alertas', component: AlertasComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'mercado', component: MercadoComponent, canActivate: [AuthGuard] },
  { path: 'historial', component: HistorialComponent, canActivate: [AuthGuard] },
  { path: 'detalle-activo/:id', component: DetalleActivoComponent, canActivate: [AuthGuard] },
  { path: 'dividendos', component: DividendosComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }