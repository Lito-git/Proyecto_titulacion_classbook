// Importamos las dependencias necesarias
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LINKS_DOCENTE } from '../../shared/navbar.links';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {

  // Links y ruta base para el navbar compartido
  links = LINKS_DOCENTE;
  rutaBase = '/docente';

  // Datos del usuario
  nombre: string = sessionStorage.getItem('nombre') || '';

  // Variables para las tarjetas de resumen
  totalEstudiantes: number = 0;
  totalCalificaciones: number = 0;
  totalAnotacionesMes: number = 0;
  promedioGeneral: number = 0;

  // Asignaciones del docente
  asignaciones: any[] = [];

  // Actividad reciente
  actividadReciente: any[] = [];

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarDatos();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Obtiene el ID del docente desde el token JWT
  private getDocenteId(): number {
    const token = sessionStorage.getItem('token');
    return JSON.parse(atob(token!.split('.')[1])).id;
  }

  // Carga todos los datos del dashboard
  cargarDatos() {
    const id = this.getDocenteId();

    // Cargamos el resumen general
    this.http.get<any>(`${this.apiUrl}/docente/${id}/resumen`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.totalEstudiantes = data.totalEstudiantes;
        this.totalCalificaciones = data.totalCalificaciones;
        this.totalAnotacionesMes = data.totalAnotacionesMes;
        this.promedioGeneral = data.promedioGeneral;
        this.actividadReciente = data.actividadReciente;
      },
      error: (err) => console.error('Error al cargar resumen', err)
    });

    // Cargamos las asignaciones del docente
    this.http.get<any[]>(`${this.apiUrl}/docente/${id}/asignaciones`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.asignaciones = data,
      error: (err) => console.error('Error al cargar asignaciones', err)
    });
  }

  // Formatea la fecha al formato dd-mm-yyyy hh:mm a.m/p.m
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

  // Separa el título del detalle usando el separador |
  getTitulo(detalle: string): string {
    return detalle?.includes('|') ? detalle.split('|')[0] : detalle;
  }
}