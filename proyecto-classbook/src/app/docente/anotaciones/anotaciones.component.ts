// Importamos las dependencias necesarias
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LINKS_DOCENTE } from '../../shared/navbar.links';

@Component({
  selector: 'app-anotaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './anotaciones.component.html',
  styleUrl: './anotaciones.component.css'
})
export class AnotacionesComponent implements OnInit {

  // Links y ruta base para el navbar compartido
  links = LINKS_DOCENTE;
  rutaBase = '/docente';

  // Lista de anotaciones y filtro activo
  anotaciones: any[] = [];
  filtroActivo: string = 'todas';

  // Estudiantes del curso del docente
  estudiantes: any[] = [];
  cursoId: number = 0;

  // Formulario de registro
  formulario = {
    estudiante_id: 0,
    tipo: 'positiva',
    descripcion: ''
  };

  mensajeExito: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarDatos();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private getDocenteId(): number {
    const token = sessionStorage.getItem('token');
    return JSON.parse(atob(token!.split('.')[1])).id;
  }

  // Carga las anotaciones y los estudiantes del curso del docente
  cargarDatos() {
    const id = this.getDocenteId();

    // Cargamos anotaciones del docente
    this.cargarAnotaciones();

    // Obtenemos el curso asignado al docente para cargar sus estudiantes
    this.http.get<any[]>(`${this.apiUrl}/docente/${id}/asignaciones`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.cursoId = data[0].curso_id;
          this.cargarEstudiantes();
        }
      },
      error: (err) => console.error('Error al cargar asignaciones', err)
    });
  }

  // Carga los estudiantes del curso asignado al docente
  cargarEstudiantes() {
    this.http.get<any[]>(`${this.apiUrl}/docente/curso/${this.cursoId}/estudiantes`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.estudiantes = data,
      error: (err) => console.error('Error al cargar estudiantes', err)
    });
  }

  // Carga las anotaciones con filtro opcional por tipo
  cargarAnotaciones() {
    const id = this.getDocenteId();
    const url = this.filtroActivo === 'todas'
      ? `${this.apiUrl}/docente/${id}/anotaciones`
      : `${this.apiUrl}/docente/${id}/anotaciones?tipo=${this.filtroActivo}`;

    this.http.get<any[]>(url, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.anotaciones = data,
      error: (err) => console.error('Error al cargar anotaciones', err)
    });
  }

  // Cambia el filtro activo y recarga las anotaciones
  cambiarFiltro(filtro: string) {
    this.filtroActivo = filtro;
    this.cargarAnotaciones();
  }

  // Registra una nueva anotación
  registrarAnotacion() {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (!this.formulario.estudiante_id || !this.formulario.descripcion.trim()) {
      this.mensajeError = 'Selecciona un estudiante y escribe una descripción.';
      return;
    }

    this.cargando = true;

    this.http.post(`${this.apiUrl}/docente/anotaciones`,
      this.formulario,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res: any) => {
        this.mensajeExito = res.mensaje;
        this.formulario = { estudiante_id: 0, tipo: 'positiva', descripcion: '' };
        this.cargarAnotaciones();
        this.cargando = false;
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al registrar anotación.';
        this.cargando = false;
      }
    });
  }

  // Formatea la fecha al formato dd-mm-yyyy
  formatearFecha(fecha: string): string {
    const d = new Date(fecha);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}-${mes}-${anio}`;
  }
}