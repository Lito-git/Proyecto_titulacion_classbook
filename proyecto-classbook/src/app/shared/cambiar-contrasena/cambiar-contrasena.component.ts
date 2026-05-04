import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent, NavLink } from '../navbar/navbar.component';

@Component({
  selector: 'app-cambiar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './cambiar-contrasena.component.html',
  styleUrls: ['./cambiar-contrasena.component.css']
})
export class CambiarContrasenaComponent {

  // Links y ruta base recibidos desde el componente padre según el rol
  @Input() links: NavLink[] = [];
  @Input() rutaBase: string = '';
  @Input() mostrarAsignatura: boolean = false;

  // Variables del formulario
  contrasenaActual: string = '';
  contrasenaNueva: string = '';
  confirmarContrasena: string = '';
  mensajeExito: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  // Variables para mostrar/ocultar contraseñas
  mostrarActual: boolean = false;
  mostrarNueva: boolean = false;
  mostrarConfirmar: boolean = false;

  private apiUrl = 'https://classbook-backend.onrender.com';

  constructor(private http: HttpClient) { }

  // Cambia la contraseña del usuario autenticado
  cambiarContrasena() {
    this.mensajeExito = '';
    this.mensajeError = '';

    // Validamos que todos los campos estén completos
    if (!this.contrasenaActual.trim() || !this.contrasenaNueva.trim() || !this.confirmarContrasena.trim()) {
      this.mensajeError = 'Todos los campos son obligatorios.';
      return;
    }

    // Validamos que las contraseñas nuevas coincidan
    if (this.contrasenaNueva !== this.confirmarContrasena) {
      this.mensajeError = 'Las contraseñas nuevas no coinciden.';
      return;
    }

    // Validamos longitud mínima
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