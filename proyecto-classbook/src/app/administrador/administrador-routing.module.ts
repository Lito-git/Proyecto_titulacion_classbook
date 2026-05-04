import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { CursosComponent } from './cursos/cursos.component';
import { AsignaturasComponent } from './asignaturas/asignaturas.component';
import { HistorialComponent } from './historial/historial.component';
import { CambiarContrasenaAdminComponent } from './cambiar-contrasena/cambiar-contrasena.component';

// Rutas disponibles para el rol administrador
const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'usuarios', component: UsuariosComponent },
  { path: 'cursos', component: CursosComponent },
  { path: 'asignaturas', component: AsignaturasComponent },
  { path: 'historial', component: HistorialComponent },
  { path: 'cambiar-contrasena', component: CambiarContrasenaAdminComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministradorRoutingModule { }