// Módulo de rutas del panel docente
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InicioComponent } from './inicio/inicio.component';
import { CalificacionesComponent } from './calificaciones/calificaciones.component';
import { AnotacionesComponent } from './anotaciones/anotaciones.component';
import { CambiarContrasenaDocenteComponent } from './cambiar-contrasena/cambiar-contrasena.component';

// Rutas disponibles para el rol docente
const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'calificaciones', component: CalificacionesComponent },
  { path: 'anotaciones', component: AnotacionesComponent },
  { path: 'cambiar-contrasena', component: CambiarContrasenaDocenteComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocenteRoutingModule { }