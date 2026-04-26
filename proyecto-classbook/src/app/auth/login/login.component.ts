// Importamos las dependencias necesarias
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule], // Standalone importa sus dependencias directamente
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email: string = '';
  contrasena: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  constructor(private authService: AuthService, private router: Router) { }

  iniciarSesion() {
    this.mensajeError = '';
    this.cargando = true;

    this.authService.login(this.email, this.contrasena).subscribe({
      next: (respuesta: any) => {
        this.authService.guardarSesion(respuesta.token, respuesta.rol);
        this.router.navigate([`/${respuesta.rol}`]);
        this.cargando = false;
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al iniciar sesión.';
        this.cargando = false;
      }
    });
  }
}