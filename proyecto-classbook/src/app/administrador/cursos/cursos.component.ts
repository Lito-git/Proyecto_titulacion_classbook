// Importamos las dependencias necesarias
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './cursos.component.html',
  styleUrl: './cursos.component.css'
})
export class CursosComponent implements OnInit {

  cursos: any[] = [];
  cargando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  // Control del modal
  mostrarModal: boolean = false;
  modoEdicion: boolean = false;

  // Datos del formulario
  formulario = {
    id: 0,
    nombre: '',
    nivel: ''
  };

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarCursos();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Carga todos los cursos desde el backend
  cargarCursos() {
    this.http.get<any[]>(`${this.apiUrl}/cursos`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.cursos = data,
      error: () => this.mensajeError = 'Error al cargar cursos.'
    });
  }

  // Abre el modal para crear un nuevo curso
  abrirModalCrear() {
    this.modoEdicion = false;
    this.formulario = { id: 0, nombre: '', nivel: '' };
    this.mensajeExito = '';
    this.mensajeError = '';
    this.mostrarModal = true;
  }

  // Abre el modal para editar un curso existente
  abrirModalEditar(curso: any) {
    this.modoEdicion = true;
    this.formulario = {
      id: curso.curso_id,
      nombre: curso.curso_nombre,
      nivel: curso.curso_nivel
    };
    this.mensajeExito = '';
    this.mensajeError = '';
    this.mostrarModal = true;
  }

  // Cierra el modal
  cerrarModal() {
    this.mostrarModal = false;
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  // Guarda el curso (crear o editar)
  guardarCurso() {
    this.mensajeExito = '';
    this.mensajeError = '';
    this.cargando = true;

    if (this.modoEdicion) {
      this.http.put(`${this.apiUrl}/cursos/${this.formulario.id}`,
        { nombre: this.formulario.nombre, nivel: this.formulario.nivel },
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res: any) => {
          this.mensajeExito = res.mensaje;
          this.cargarCursos();
          this.cargando = false;
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al editar curso.';
          this.cargando = false;
        }
      });
    } else {
      this.http.post(`${this.apiUrl}/cursos`,
        { nombre: this.formulario.nombre, nivel: this.formulario.nivel },
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res: any) => {
          this.mensajeExito = res.mensaje;
          this.cargarCursos();
          this.cargando = false;
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al crear curso.';
          this.cargando = false;
        }
      });
    }
  }

  // Elimina un curso
  eliminarCurso(id: number) {
    if (!confirm('¿Estás seguro de eliminar este curso?')) return;
    this.http.delete(`${this.apiUrl}/cursos/${id}`, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        this.cargarCursos();
      },
      error: (err) => alert(err.error?.mensaje || 'Error al eliminar curso.')
    });
  }
}