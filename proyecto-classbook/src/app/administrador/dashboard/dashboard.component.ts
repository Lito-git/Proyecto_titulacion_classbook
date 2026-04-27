// Importamos las dependencias necesarias
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // Variables para las tarjetas de resumen
  totalUsuarios: number = 0;
  totalCursos: number = 0;
  totalAsignaturas: number = 0;
  totalHistorial: number = 0;

  estadoSistema = {
    baseDatos: 'Verificando...',
    backend: 'Verificando...',
    autenticacion: 'Verificando...'
  };

  // Variables para actividad reciente
  actividadReciente: any[] = [];

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarResumen();
  }

  cargarResumen() {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // Obtenemos total de usuarios
    this.http.get<any[]>(`${this.apiUrl}/usuarios`, { headers }).subscribe({
      next: (data) => this.totalUsuarios = data.length,
      error: (err) => console.error('Error al cargar usuarios', err)
    });

    // Obtenemos total de cursos
    this.http.get<any[]>(`${this.apiUrl}/cursos`, { headers }).subscribe({
      next: (data) => this.totalCursos = data.length,
      error: (err) => console.error('Error al cargar cursos', err)
    });

    // Obtenemos total de asignaturas
    this.http.get<any[]>(`${this.apiUrl}/asignaturas`, { headers }).subscribe({
      next: (data) => this.totalAsignaturas = data.length,
      error: (err) => console.error('Error al cargar asignaturas', err)
    });

    // Verificamos el estado del sistema
    this.http.get<any>(`${this.apiUrl}/estado`).subscribe({
      next: (data) => this.estadoSistema = data,
      error: () => this.estadoSistema = {
        baseDatos: 'Sin conexión',
        backend: 'Sin conexión',
        autenticacion: 'Sin conexión'
      }
    });

    // Obtenemos historial y tomamos los 5 más recientes para actividad reciente
    this.http.get<any[]>(`${this.apiUrl}/historial`, { headers }).subscribe({
      next: (data) => {
        this.totalHistorial = data.length;
        this.actividadReciente = data.slice(0, 5); // Últimos 5 registros
      },
      error: (err) => console.error('Error al cargar historial', err)
    });
  }
}