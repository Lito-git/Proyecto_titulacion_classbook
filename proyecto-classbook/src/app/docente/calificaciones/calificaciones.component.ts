// Importamos las dependencias necesarias
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LINKS_DOCENTE } from '../../shared/navbar.links';

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './calificaciones.component.html',
  styleUrl: './calificaciones.component.css'
})
export class CalificacionesComponent implements OnInit {

  // Links y ruta base para el navbar compartido
  links = LINKS_DOCENTE;
  rutaBase = '/docente';

  // Asignaciones del docente
  asignaciones: any[] = [];
  cursoSeleccionado: number = 0;
  asignaturaSeleccionada: number = 0;

  // Datos de calificaciones y estudiantes
  calificaciones: any[] = [];
  estudiantes: any[] = [];
  mostrarTabla: boolean = false;

  // Formulario de registro
  formulario = {
    estudiante_id: 0,
    tipo: '',
    numero: 1,
    nota: ''
  };

  // Tipos de evaluación disponibles según la BD
  tiposEvaluacion = [
    { valor: 'prueba', numero: 1, label: 'Prueba 1' },
    { valor: 'prueba', numero: 2, label: 'Prueba 2' },
    { valor: 'prueba', numero: 3, label: 'Prueba 3' },
    { valor: 'actividad', numero: 1, label: 'Actividad' },
    { valor: 'examen', numero: 1, label: 'Examen' }
  ];

  tipoSeleccionado: any = null;

  // Variables para el buscador de estudiantes en el formulario
  busquedaEstudiante: string = '';
  estudiantesFiltrados: any[] = [];
  estudianteSeleccionado: any = null;
  mostrarSugerencias: boolean = false;

  // Variables para el buscador en la tabla
  busquedaTabla: string = '';
  calificacionesFiltradas: any[] = [];

  // Calificación en edición
  calificacionEditando: any = null;
  notaEditando: string = '';

  mensajeExito: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarAsignaciones();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private getDocenteId(): number {
    const token = sessionStorage.getItem('token');
    return JSON.parse(atob(token!.split('.')[1])).id;
  }

  // Carga las asignaciones del docente y consulta automáticamente si solo tiene una
  cargarAsignaciones() {
    const id = this.getDocenteId();
    this.http.get<any[]>(`${this.apiUrl}/docente/${id}/asignaciones`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.asignaciones = data;
        if (data.length === 1) {
          this.cursoSeleccionado = data[0].curso_id;
          this.asignaturaSeleccionada = data[0].asignatura_id;
          this.consultar();
        }
      },
      error: (err) => console.error('Error al cargar asignaciones', err)
    });
  }

  // Consulta calificaciones y estudiantes del curso y asignatura seleccionados
  consultar() {
    if (!this.cursoSeleccionado || !this.asignaturaSeleccionada) {
      this.mensajeError = 'Selecciona un curso y una asignatura.';
      return;
    }
    this.mensajeError = '';

    this.http.get<any[]>(`${this.apiUrl}/docente/calificaciones/${this.cursoSeleccionado}/${this.asignaturaSeleccionada}`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.calificaciones = data;
        this.calificacionesFiltradas = data;
        this.mostrarTabla = true;
      },
      error: (err) => console.error('Error al cargar calificaciones', err)
    });

    this.http.get<any[]>(`${this.apiUrl}/docente/curso/${this.cursoSeleccionado}/estudiantes`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.estudiantes = data,
      error: (err) => console.error('Error al cargar estudiantes', err)
    });
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

  // Selecciona un estudiante desde las sugerencias del buscador
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

  // Filtra la tabla de calificaciones por nombre de estudiante
  filtrarTabla() {
    const texto = this.busquedaTabla.toLowerCase();
    if (!texto) {
      this.calificacionesFiltradas = this.calificaciones;
      return;
    }
    this.calificacionesFiltradas = this.calificaciones.filter(est => {
      const nombreCompleto = `${est.usuario_nombre} ${est.usuario_segundo_nombre || ''} ${est.usuario_apellido} ${est.usuario_segundo_apellido || ''}`.toLowerCase();
      return nombreCompleto.includes(texto);
    });
  }

  // Actualiza tipo y numero según el tipo de evaluación seleccionado
  onTipoChange() {
    if (this.tipoSeleccionado) {
      this.formulario.tipo = this.tipoSeleccionado.valor;
      this.formulario.numero = this.tipoSeleccionado.numero;
    }
  }

  // Registra una nueva calificación
  registrarCalificacion() {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (!this.formulario.estudiante_id || !this.formulario.tipo || !this.formulario.nota) {
      this.mensajeError = 'Completa todos los campos.';
      return;
    }

    this.cargando = true;

    const body = {
      estudiante_id: this.formulario.estudiante_id,
      asignatura_id: this.asignaturaSeleccionada,
      curso_id: this.cursoSeleccionado,
      tipo: this.formulario.tipo,
      numero: this.formulario.numero,
      nota: parseFloat(this.formulario.nota)
    };

    this.http.post(`${this.apiUrl}/docente/calificaciones`, body, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        this.mensajeExito = res.mensaje;
        this.cargando = false;
        this.limpiarEstudiante();
        this.consultar();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al registrar calificación.';
        this.cargando = false;
      }
    });
  }

  // Inicia la edición de una calificación
  iniciarEdicion(cal: any) {
    this.calificacionEditando = cal;
    this.notaEditando = cal.calificacion_nota;
  }

  // Cancela la edición
  cancelarEdicion() {
    this.calificacionEditando = null;
    this.notaEditando = '';
  }

  // Guarda la modificación de una calificación
  guardarEdicion(calificacionId: number) {
    this.mensajeExito = '';
    this.mensajeError = '';

    this.http.put(`${this.apiUrl}/docente/calificaciones/${calificacionId}`,
      { nota: parseFloat(this.notaEditando) },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res: any) => {
        this.mensajeExito = res.mensaje;
        this.calificacionEditando = null;
        this.consultar();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al modificar calificación.';
      }
    });
  }

  // Obtiene la nota de un estudiante para un tipo y número específico
  getNota(calificaciones: any[], tipo: string, numero: number): any {
    return calificaciones.find(c => c.calificacion_tipo === tipo && c.calificacion_numero === numero);
  }

  // Calcula el promedio de un estudiante
  getPromedio(calificaciones: any[]): string {
    if (calificaciones.length === 0) return '-';
    const suma = calificaciones.reduce((acc, c) => acc + parseFloat(c.calificacion_nota), 0);
    return (suma / calificaciones.length).toFixed(1);
  }
  
  //Para los badges de colores según la nota en la tabla de calificaciones
  getClaseNota(nota: any): string {
    const n = parseFloat(nota);
    if (isNaN(n)) return '';
    if (n >= 6.0) return 'nota-excelente';
    if (n >= 5.0) return 'nota-bueno';
    if (n >= 4.0) return 'nota-suficiente';
    return 'nota-insuficiente';
  }
}