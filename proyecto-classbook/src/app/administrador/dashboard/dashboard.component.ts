// Importamos las dependencias necesarias
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LINKS_ADMINISTRADOR } from '../../shared/navbar.links';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // Links del navbar del administrador
  links = LINKS_ADMINISTRADOR;
  rutaBase = '/administrador';

  // Variables para las tarjetas de resumen
  totalUsuarios: number = 0;
  totalCursos: number = 0;
  totalAsignaturas: number = 0;
  totalHistorial: number = 0;
  actividadReciente: any[] = [];
  estadoSistema = {
    baseDatos: 'Verificando...',
    backend: 'Verificando...',
    autenticacion: 'Verificando...'
  };

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarResumen();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  cargarResumen() {
    this.http.get<any[]>(`${this.apiUrl}/usuarios`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.totalUsuarios = data.length,
      error: (err) => console.error('Error al cargar usuarios', err)
    });

    this.http.get<any[]>(`${this.apiUrl}/cursos`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.totalCursos = data.length,
      error: (err) => console.error('Error al cargar cursos', err)
    });

    this.http.get<any[]>(`${this.apiUrl}/asignaturas`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.totalAsignaturas = data.length,
      error: (err) => console.error('Error al cargar asignaturas', err)
    });

    this.http.get<any[]>(`${this.apiUrl}/historial`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.totalHistorial = data.length;
        this.actividadReciente = data.slice(0, 5);
      },
      error: (err) => console.error('Error al cargar historial', err)
    });

    this.http.get<any>(`${this.apiUrl}/estado`).subscribe({
      next: (data) => this.estadoSistema = data,
      error: () => this.estadoSistema = {
        baseDatos: 'Sin conexión',
        backend: 'Sin conexión',
        autenticacion: 'Sin conexión'
      }
    });
  }

  // Métodos para el historial
  getTitulo(detalle: string): string {
    return detalle?.includes('|') ? detalle.split('|')[0] : detalle;
  }

  formatearFecha(fecha: string): string {
    const d = new Date(fecha);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();
    let horas = d.getHours();
    const minutos = d.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
    horas = horas % 12 || 12;
    return `${dia}-${mes}-${anio}, ${horas}:${minutos} ${ampm}`;
  }
}