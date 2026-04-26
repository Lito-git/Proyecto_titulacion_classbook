import { NgModule } from '@angular/core';
import { AuthRoutingModule } from './auth-routing.module';

// Con componentes standalone el módulo solo necesita registrar las rutas
@NgModule({
  imports: [
    AuthRoutingModule
  ]
})
export class AuthModule { }