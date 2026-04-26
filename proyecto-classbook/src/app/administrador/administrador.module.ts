import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdministradorRoutingModule } from './administrador-routing.module';
import { SharedModule } from '../shared/shared.module';

// En Angular 18 los componentes son standalone por defecto
// por lo que no se declaran en el módulo, sino que se importan directamente
// en el routing o en el propio componente standalone
@NgModule({
  imports: [
    CommonModule,
    AdministradorRoutingModule,
    SharedModule
  ]
})
export class AdministradorModule { }