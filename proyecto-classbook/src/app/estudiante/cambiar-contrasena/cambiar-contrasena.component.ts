// Wrapper de cambiar contraseña para el rol estudiante
import { Component } from '@angular/core';
import { CambiarContrasenaComponent } from '../../shared/cambiar-contrasena/cambiar-contrasena.component';
import { LINKS_ESTUDIANTE } from '../../shared/navbar.links';

@Component({
    selector: 'app-cambiar-contrasena-estudiante',
    standalone: true,
    imports: [CambiarContrasenaComponent],
    template: `<app-cambiar-contrasena [links]="links" [rutaBase]="rutaBase"></app-cambiar-contrasena>`
})
export class CambiarContrasenaEstudianteComponent {
    links = LINKS_ESTUDIANTE;
    rutaBase = '/estudiante';
}