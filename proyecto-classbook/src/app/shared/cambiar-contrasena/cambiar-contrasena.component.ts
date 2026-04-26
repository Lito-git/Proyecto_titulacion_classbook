// Importamos las dependencias necesarias
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-cambiar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule], // Standalone importa sus dependencias directamente
  templateUrl: './cambiar-contrasena.component.html',
  styleUrls: ['./cambiar-contrasena.component.css']
})
export class CambiarContrasenaComponent {

  contrasenaActual: string = '';
  contrasenaNueva: string = '';
  confirmarContrasena: string = '';
  mensajeExito: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  cambiarContrasena() {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.contrasenaNueva !== this.confirmarContrasena) {
      this.mensajeError = 'Las contraseñas nuevas no coinciden.';
      return;
    }

    if (this.contrasenaNueva.length < 6) {
      this.mensajeError = 'La contraseña nueva debe tener al menos 6 caracteres.';
      return;
    }

    this.cargando = true;

    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.post(`${this.apiUrl}/auth/cambiar-contrasena`,
      { contrasenaActual: this.contrasenaActual, contrasenaNueva: this.contrasenaNueva },
      { headers }
    ).subscribe({
      next: (respuesta: any) => {
        this.mensajeExito = respuesta.mensaje;
        this.contrasenaActual = '';
        this.contrasenaNueva = '';
        this.confirmarContrasena = '';
        this.cargando = false;
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al cambiar la contraseña.';
        this.cargando = false;
      }
    });
  }
}