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

  links = LINKS_DOCENTE;
  rutaBase = '/docente';

  anotaciones: any[] = [];
  filtroActivo: string = 'todas';

  // Estudiantes de TODOS los cursos del docente
  estudiantes: any[] = [];

  formulario = {
    estudiante_id: 0,
    tipo: 'positiva',
    descripcion: ''
  };

  busquedaEstudiante: string = '';
  estudiantesFiltrados: any[] = [];
  estudianteSeleccionado: any = null;
  mostrarSugerencias: boolean = false;

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

  cargarDatos() {
    const id = this.getDocenteId();
    this.cargarAnotaciones();

    // Cargamos todos los estudiantes de todos los cursos del docente
    this.http.get<any[]>(`${this.apiUrl}/docente/${id}/estudiantes`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.estudiantes = data,
      error: (err) => console.error('Error al cargar estudiantes', err)
    });
  }

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

  cambiarFiltro(filtro: string) {
    this.filtroActivo = filtro;
    this.cargarAnotaciones();
  }

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

  seleccionarEstudiante(est: any) {
    this.estudianteSeleccionado = est;
    this.formulario.estudiante_id = est.estudiante_id;
    this.busquedaEstudiante = `${est.usuario_nombre} ${est.usuario_segundo_nombre || ''} ${est.usuario_apellido} ${est.usuario_segundo_apellido || ''}`.trim();
    this.mostrarSugerencias = false;
    this.estudiantesFiltrados = [];
  }

  limpiarEstudiante() {
    this.estudianteSeleccionado = null;
    this.formulario.estudiante_id = 0;
    this.busquedaEstudiante = '';
    this.estudiantesFiltrados = [];
    this.mostrarSugerencias = false;
  }

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

  formatearFecha(fecha: string): string {
    const d = new Date(fecha);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}-${mes}-${anio}`;
  }
}