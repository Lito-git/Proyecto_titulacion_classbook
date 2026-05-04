import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recuperar-contrasena.component.html',
  styleUrls: ['./recuperar-contrasena.component.css']
})
export class RecuperarContrasenaComponent {

  // Variables bindeadas con el formulario
  email: string = '';
  mensajeExito: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient, private router: Router) { }

  // Método para solicitar la recuperación de contraseña
  recuperarContrasena() {
    this.mensajeExito = '';
    this.mensajeError = '';

    if(!this.email.trim()) {
      this.mensajeError = 'Por favor, ingresa tu correo electrónico.';
      return;
    }

    this.cargando = true;

    this.http.post(`${this.apiUrl}/auth/recuperar-contrasena`, { email: this.email }).subscribe({
      next: (respuesta: any) => {
        this.mensajeExito = respuesta.mensaje;
        this.cargando = false;
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al recuperar la contraseña.';
        this.cargando = false;
      }
    });
  }

  // Navega de vuelta al login
  volverAlLogin() {
    this.router.navigate(['/login']);
  }
}