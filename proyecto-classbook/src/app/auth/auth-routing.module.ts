import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RecuperarContrasenaComponent } from './recuperar-contrasena/recuperar-contrasena.component';

// Rutas del módulo de autenticación
const routes: Routes = [
  { path: '', component: LoginComponent },                                    // Vista de login
  { path: 'recuperar-contrasena', component: RecuperarContrasenaComponent }  // Vista de recuperación
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }