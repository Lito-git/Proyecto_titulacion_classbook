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

  // Variables para el buscador de estudiantes en el formulario
  busquedaEstudiante: string = '';
  estudiantesFiltrados: any[] = [];
  estudianteSeleccionado: any = null;
  mostrarSugerencias: boolean = false;

  // Variable para el buscador en la lista de anotaciones
  busquedaAnotaciones: string = '';
  anotacionesFiltradas: any[] = [];

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
    this.cargarAnotaciones();

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
      next: (data) => {
        this.anotaciones = data;
        this.anotacionesFiltradas = data;
        this.filtrarAnotaciones();
      },
      error: (err) => console.error('Error al cargar anotaciones', err)
    });
  }

  // Cambia el filtro activo y recarga las anotaciones
  cambiarFiltro(filtro: string) {
    this.filtroActivo = filtro;
    this.cargarAnotaciones();
  }

  // Filtra estudiantes en el buscador del formulario
  filtrarEstudiantes() {
    const texto = this.busquedaEstudiante.toLowerCase();
    if (texto.length < 2) {
      this.estudiantesFiltrados = [];
      this.mostrarSugerencias = false;
      return;
    }
    this.estudiantesFiltrados = this.estudiantes.filter(est => {
      const nombreCompleto = `${est.usuario_nombre} ${est.usuario_segundo_nombre || ''} ${est.usuario_apellido} ${est.usuario_segundo_apellido || ''}`.toLowerCase();
      return nombreCompleto.includes(texto);
    });
    this.mostrarSugerencias = true;
  }

  // Selecciona un estudiante desde las sugerencias
  seleccionarEstudiante(est: any) {
    this.estudianteSeleccionado = est;
    this.formulario.estudiante_id = est.estudiante_id;
    this.busquedaEstudiante = `${est.usuario_nombre} ${est.usuario_segundo_nombre || ''} ${est.usuario_apellido} ${est.usuario_segundo_apellido || ''}`.trim();
    this.mostrarSugerencias = false;
    this.estudiantesFiltrados = [];
  }

  // Limpia la selección del estudiante
  limpiarEstudiante() {
    this.estudianteSeleccionado = null;
    this.formulario.estudiante_id = 0;
    this.busquedaEstudiante = '';
    this.estudiantesFiltrados = [];
    this.mostrarSugerencias = false;
  }

  // Filtra la lista de anotaciones por nombre de estudiante
  filtrarAnotaciones() {
    const texto = this.busquedaAnotaciones.toLowerCase();
    if (!texto) {
      this.anotacionesFiltradas = this.anotaciones;
      return;
    }
    this.anotacionesFiltradas = this.anotaciones.filter(a => {
      const nombreCompleto = `${a.usuario_nombre} ${a.usuario_segundo_nombre || ''} ${a.usuario_apellido} ${a.usuario_segundo_apellido || ''}`.toLowerCase();
      return nombreCompleto.includes(texto);
    });
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
        this.limpiarEstudiante();
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