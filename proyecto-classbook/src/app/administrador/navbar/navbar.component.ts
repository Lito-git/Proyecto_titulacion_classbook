// Importamos las dependencias necesarias
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  // Datos del usuario autenticado desde sessionStorage
  nombre: string = sessionStorage.getItem('nombre') || '';
  apellido: string = sessionStorage.getItem('apellido') || '';

  constructor(private router: Router) { }

  // Cierra la sesión y redirige al login
  cerrarSesion() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}