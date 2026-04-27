// Importamos las dependencias necesarias
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // URL base del backend
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient, private router: Router) { }

  // Método para iniciar sesión
  // Envía las credenciales al backend y recibe el token JWT
  login(email: string, contrasena: string) {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, contrasena });
  }

  // sessionStorage se limpia automáticamente al cerrar el navegador
  // Guarda el token, rol, nombre y apellido en sessionStorage al iniciar sesión
  guardarSesion(token: string, rol: string, nombre: string, apellido: string) {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('rol', rol);
    sessionStorage.setItem('nombre', nombre);
    sessionStorage.setItem('apellido', apellido);
  }

  // Cierra la sesión eliminando los datos del sessionStorage
  // y redirige al login
  cerrarSesion() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  // Verifica si el usuario está autenticado
  estaAutenticado(): boolean {
    return !!sessionStorage.getItem('token');
  }

  // Retorna el rol del usuario actual
  obtenerRol(): string | null {
    return sessionStorage.getItem('rol');
  }
}