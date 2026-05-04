import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LINKS_ESTUDIANTE } from '../../shared/navbar.links';

@Component({
  selector: 'app-anotaciones',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './anotaciones.component.html',
  styleUrl: './anotaciones.component.css'
})
export class AnotacionesComponent implements OnInit {

  // Links y ruta base para el navbar compartido
  links = LINKS_ESTUDIANTE;
  rutaBase = '/estudiante';

  // Lista de anotaciones positivas
  anotaciones: any[] = [];
  totalSemestre: number = 0;

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarAnotaciones();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private getUsuarioId(): number {
    const token = sessionStorage.getItem('token');
    return JSON.parse(atob(token!.split('.')[1])).id;
  }

  // Carga las anotaciones positivas del estudiante
  cargarAnotaciones() {
    const id = this.getUsuarioId();
    this.http.get<any>(`${this.apiUrl}/estudiante/${id}/anotaciones-positivas`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.anotaciones = data.anotaciones;
        this.totalSemestre = data.totalSemestre;
      },
      error: (err) => console.error('Error al cargar anotaciones', err)
    });
  }

  // Formatea la fecha al formato dd de mes de yyyy
  formatearFecha(fecha: string): string {
    const d = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('es-CL', opciones);
  }

  // Construye el nombre completo del profesor
  getNombreProfesor(a: any): string {
    return `${a.profesor_nombre}${a.profesor_segundo_nombre ? ' ' + a.profesor_segundo_nombre : ''} ${a.profesor_apellido}${a.profesor_segundo_apellido ? ' ' + a.profesor_segundo_apellido : ''}`.trim();
  }
}