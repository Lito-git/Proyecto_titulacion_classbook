// Módulo de rutas del panel administrador
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { CursosComponent } from './cursos/cursos.component';
import { AsignaturasComponent } from './asignaturas/asignaturas.component';
import { HistorialComponent } from './historial/historial.component';
import { CambiarContrasenaComponent } from '../shared/cambiar-contrasena/cambiar-contrasena.component';

// Rutas disponibles para el rol administrador
const routes: Routes = [
  { path: '', component: DashboardComponent },                                    // Dashboard principal
  { path: 'usuarios', component: UsuariosComponent },                            // Gestión de usuarios
  { path: 'cursos', component: CursosComponent },                                // Gestión de cursos
  { path: 'asignaturas', component: AsignaturasComponent },                      // Gestión de asignaturas
  { path: 'historial', component: HistorialComponent },                          // Historial de cambios
  { path: 'cambiar-contrasena', component: CambiarContrasenaComponent }          // Cambiar contraseña
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministradorRoutingModule { }