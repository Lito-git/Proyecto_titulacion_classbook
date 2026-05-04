import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule], // Standalone importa sus dependencias directamente
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

    // Validar que los campos no estén vacíos antes de enviar
    if (!this.email.trim() || !this.contrasena.trim()) {
      this.mensajeError = 'Por favor ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;
    
    this.authService.login(this.email, this.contrasena).subscribe({
      next: (respuesta: any) => {
        this.authService.guardarSesion(
          respuesta.token,
          respuesta.rol,
          respuesta.nombre,
          respuesta.apellido,
          respuesta.asignatura,
          respuesta.curso,
          respuesta.segundo_nombre,
          respuesta.segundo_apellido
        );
        this.router.navigate([`/${respuesta.rol}`])
          .finally(() => {
            this.cargando = false;
          });
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al iniciar sesión.';
        this.cargando = false;
      }
    });
  }
}