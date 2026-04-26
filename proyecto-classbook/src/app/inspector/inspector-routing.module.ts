// Módulo de rutas del panel inspector
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CambiarContrasenaComponent } from '../shared/cambiar-contrasena/cambiar-contrasena.component';

// Rutas disponibles para el rol inspector
const routes: Routes = [
  { path: '', component: DashboardComponent },                           // Vista principal del inspector
  { path: 'cambiar-contrasena', component: CambiarContrasenaComponent } // Vista de cambio de contraseña
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InspectorRoutingModule { }