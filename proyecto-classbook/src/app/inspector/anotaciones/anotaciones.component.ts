import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LINKS_INSPECTOR } from '../../shared/navbar.links';

@Component({
  selector: 'app-anotaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './anotaciones.component.html',
  styleUrl: './anotaciones.component.css'
})
export class AnotacionesComponent implements OnInit {

  // Links y ruta base para el navbar compartido
  links = LINKS_INSPECTOR;
  rutaBase = '/inspector';

  // Totales
  totalPositivas: number = 0;
  totalNegativas: number = 0;

  // Lista de anotaciones
  anotaciones: any[] = [];

  // Filtros
  cursos: any[] = [];
  filtroTipo: string = 'todas';
  filtroCurso: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Variables para el buscador de estudiante con autocompletado
  busquedaEstudiante: string = '';
  mostrarSugerencias: boolean = false;
  estudiantesFiltrados: any[] = [];
  estudianteSeleccionado: any = null;

  private apiUrl = 'https://classbook-backend.onrender.com';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarCursos();
    this.cargarAnotaciones();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Carga los cursos para el selector de filtro
  cargarCursos() {
    this.http.get<any[]>(`${this.apiUrl}/inspector/cursos`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.cursos = data,
      error: (err) => console.error('Error al cargar cursos', err)
    });
  }

  // Carga las anotaciones con los filtros aplicados
  cargarAnotaciones() {
    let url = `${this.apiUrl}/inspector/anotaciones?`;
    if (this.filtroTipo !== 'todas') url += `tipo=${this.filtroTipo}&`;
    if (this.filtroCurso) url += `curso_id=${this.filtroCurso}&`;
    if (this.filtroFechaInicio) url += `fecha_inicio=${this.filtroFechaInicio}&`;
    if (this.filtroFechaFin) url += `fecha_fin=${this.filtroFechaFin}&`;
    if (this.estudianteSeleccionado) url += `busqueda=${this.busquedaEstudiante}`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.totalPositivas = data.totalPositivas;
        this.totalNegativas = data.totalNegativas;
        this.anotaciones = data.anotaciones;
      },
      error: (err) => console.error('Error al cargar anotaciones', err)
    });
  }

  // Filtra estudiantes al escribir en el buscador
  filtrarEstudiantes() {
    if (this.busquedaEstudiante.length < 2) {
      this.estudiantesFiltrados = [];
      this.mostrarSugerencias = false;
      return;
    }
    this.http.get<any>(`${this.apiUrl}/inspector/reportes?busqueda=${this.busquedaEstudiante}`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.estudiantesFiltrados = data.estudiantes;
        this.mostrarSugerencias = true;
      }
    });
  }

  // Selecciona un estudiante desde las sugerencias
  seleccionarEstudiante(est: any) {
    this.estudianteSeleccionado = est;
    this.busquedaEstudiante = `${est.usuario_nombre} ${est.usuario_segundo_nombre || ''} ${est.usuario_apellido} ${est.usuario_segundo_apellido || ''}`.trim();
    this.mostrarSugerencias = false;
    this.estudiantesFiltrados = [];
    this.cargarAnotaciones();
  }

  // Limpia la selección del estudiante
  limpiarEstudiante() {
    this.estudianteSeleccionado = null;
    this.busquedaEstudiante = '';
    this.estudiantesFiltrados = [];
    this.mostrarSugerencias = false;
    this.cargarAnotaciones();
  }

  // Cambia el filtro de tipo y recarga
  cambiarFiltroTipo(tipo: string) {
    this.filtroTipo = tipo;
    this.cargarAnotaciones();
  }

  // Formatea la fecha en formato legible en español
  formatearFecha(fecha: string): string {
    const d = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('es-CL', opciones);
  }

  // Construye el nombre completo del profesor
  getNombreProfesor(a: any): string {
    return `${a.profesor_nombre}${a.profesor_segundo_nombre ? ' ' + a.profesor_segundo_nombre : ''} ${a.profesor_apellido}${a.profesor_segundo_apellido ? ' ' + a.profesor_segundo_apellido : ''}`.trim();
  }

  // Construye el nombre completo del estudiante
  getNombreEstudiante(a: any): string {
    return `${a.usuario_nombre}${a.usuario_segundo_nombre ? ' ' + a.usuario_segundo_nombre : ''} ${a.usuario_apellido}${a.usuario_segundo_apellido ? ' ' + a.usuario_segundo_apellido : ''}`.trim();
  }
}