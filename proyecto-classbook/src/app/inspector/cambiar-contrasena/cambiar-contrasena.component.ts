// Wrapper de cambiar contraseña para el rol inspector
import { Component } from '@angular/core';
import { CambiarContrasenaComponent } from '../../shared/cambiar-contrasena/cambiar-contrasena.component';
import { LINKS_INSPECTOR } from '../../shared/navbar.links';

@Component({
    selector: 'app-cambiar-contrasena-inspector',
    standalone: true,
    imports: [CambiarContrasenaComponent],
    template: `<app-cambiar-contrasena [links]="links" [rutaBase]="rutaBase"></app-cambiar-contrasena>`
})
export class CambiarContrasenaInspectorComponent {
    links = LINKS_INSPECTOR;
    rutaBase = '/inspector';
}