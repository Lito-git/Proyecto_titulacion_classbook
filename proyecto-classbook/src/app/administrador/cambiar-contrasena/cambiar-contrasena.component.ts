// Wrapper de cambiar contraseña para el rol administrador
import { Component } from '@angular/core';
import { CambiarContrasenaComponent } from '../../shared/cambiar-contrasena/cambiar-contrasena.component';
import { LINKS_ADMINISTRADOR } from '../../shared/navbar.links';

@Component({
    selector: 'app-cambiar-contrasena-admin',
    standalone: true,
    imports: [CambiarContrasenaComponent],
    template: `<app-cambiar-contrasena [links]="links" [rutaBase]="rutaBase"></app-cambiar-contrasena>`
})
export class CambiarContrasenaAdminComponent {
    links = LINKS_ADMINISTRADOR;
    rutaBase = '/administrador';
}