// Módulo de rutas del panel estudiante
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CambiarContrasenaComponent } from '../shared/cambiar-contrasena/cambiar-contrasena.component';

// Rutas disponibles para el rol estudiante
const routes: Routes = [
  { path: '', component: DashboardComponent },                           // Vista principal del estudiante
  { path: 'cambiar-contrasena', component: CambiarContrasenaComponent } // Vista de cambio de contraseña
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EstudianteRoutingModule { }