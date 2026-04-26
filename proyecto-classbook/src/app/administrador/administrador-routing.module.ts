// Módulo de rutas del panel administrador
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CambiarContrasenaComponent } from '../shared/cambiar-contrasena/cambiar-contrasena.component';

// Rutas disponibles para el rol administrador
const routes: Routes = [
  { path: '', component: DashboardComponent },                           // Vista principal del administrador
  { path: 'cambiar-contrasena', component: CambiarContrasenaComponent } // Vista de cambio de contraseña
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministradorRoutingModule { }