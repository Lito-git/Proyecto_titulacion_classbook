// Wrapper de cambiar contraseña para el rol docente
import { Component } from '@angular/core';
import { CambiarContrasenaComponent } from '../../shared/cambiar-contrasena/cambiar-contrasena.component';
import { LINKS_DOCENTE } from '../../shared/navbar.links';

@Component({
    selector: 'app-cambiar-contrasena-docente',
    standalone: true,
    imports: [CambiarContrasenaComponent],
    template: `<app-cambiar-contrasena [links]="links" [rutaBase]="rutaBase" [mostrarAsignatura]="true"></app-cambiar-contrasena>`
})
export class CambiarContrasenaDocenteComponent {
    links = LINKS_DOCENTE;
    rutaBase = '/docente';
}