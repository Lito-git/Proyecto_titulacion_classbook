import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InicioComponent } from './inicio/inicio.component';
import { ReportesComponent } from './reportes/reportes.component';
import { AnotacionesComponent } from './anotaciones/anotaciones.component';
import { CambiarContrasenaInspectorComponent } from './cambiar-contrasena/cambiar-contrasena.component';

// Rutas disponibles para el rol inspector
const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'reportes', component: ReportesComponent },
  { path: 'anotaciones', component: AnotacionesComponent },
  { path: 'cambiar-contrasena', component: CambiarContrasenaInspectorComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InspectorRoutingModule { }