import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Interfaz para definir la estructura de cada link del navbar
export interface NavLink {
  label: string;
  ruta: string;
  icono: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {

  // Datos recibidos desde el componente padre
  @Input() links: NavLink[] = [];
  @Input() rutaBase: string = '';
  @Input() mostrarAsignatura: boolean = false;

  // Datos del usuario desde sessionStorage
  nombre: string = sessionStorage.getItem('nombre') || '';
  apellido: string = sessionStorage.getItem('apellido') || '';
  rol: string = sessionStorage.getItem('rol') || '';
  asignatura: string = sessionStorage.getItem('asignatura') || '';
  curso: string = sessionStorage.getItem('curso') || '';

  constructor(private router: Router) { }

  ngOnInit() { }

  // Retorna el subtítulo del rol para mostrar bajo el nombre
  getRolSubtitulo(): string {
    const roles: any = {
      'administrador': 'Administrador',
      'docente': `Docente${this.mostrarAsignatura && this.asignatura ? ' - ' + this.asignatura : ''}`,
      'inspector': 'Inspector',
      'estudiante': `Estudiante${this.curso ? ' - ' + this.curso : ''}`
    };
    return roles[this.rol] || this.rol;
  }

  // Cierra la sesión y redirige al login
  cerrarSesion() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  // Cierra el menú móvil.
  cerrarMenuMovil() {
    const toggle = document.getElementById('nav-toggle') as HTMLInputElement;
    if (toggle) {
      toggle.checked = false;
    }
  }
}