// Importamos las dependencias necesarias
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-asignaturas',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './asignaturas.component.html',
  styleUrl: './asignaturas.component.css'
})
export class AsignaturasComponent implements OnInit {

  asignaturas: any[] = [];
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
    descripcion: ''
  };

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarAsignaturas();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Carga todas las asignaturas desde el backend
  cargarAsignaturas() {
    this.http.get<any[]>(`${this.apiUrl}/asignaturas`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.asignaturas = data,
      error: () => this.mensajeError = 'Error al cargar asignaturas.'
    });
  }

  // Abre el modal para crear una nueva asignatura
  abrirModalCrear() {
    this.modoEdicion = false;
    this.formulario = { id: 0, nombre: '', descripcion: '' };
    this.mensajeExito = '';
    this.mensajeError = '';
    this.mostrarModal = true;
  }

  // Abre el modal para editar una asignatura existente
  abrirModalEditar(asignatura: any) {
    this.modoEdicion = true;
    this.formulario = {
      id: asignatura.asignatura_id,
      nombre: asignatura.asignatura_nombre,
      descripcion: asignatura.asignatura_descripcion || ''
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

  // Guarda la asignatura (crear o editar)
  guardarAsignatura() {
    this.mensajeExito = '';
    this.mensajeError = '';
    this.cargando = true;

    if (this.modoEdicion) {
      this.http.put(`${this.apiUrl}/asignaturas/${this.formulario.id}`,
        { nombre: this.formulario.nombre, descripcion: this.formulario.descripcion },
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res: any) => {
          this.mensajeExito = res.mensaje;
          this.cargarAsignaturas();
          this.cargando = false;
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al editar asignatura.';
          this.cargando = false;
        }
      });
    } else {
      this.http.post(`${this.apiUrl}/asignaturas`,
        { nombre: this.formulario.nombre, descripcion: this.formulario.descripcion },
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res: any) => {
          this.mensajeExito = res.mensaje;
          this.cargarAsignaturas();
          this.cargando = false;
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al crear asignatura.';
          this.cargando = false;
        }
      });
    }
  }

  // Elimina una asignatura
  eliminarAsignatura(id: number) {
    if (!confirm('¿Estás seguro de eliminar esta asignatura?')) return;
    this.http.delete(`${this.apiUrl}/asignaturas/${id}`, { headers: this.getHeaders() }).subscribe({
      next: () => this.cargarAsignaturas(),
      error: (err) => alert(err.error?.mensaje || 'Error al eliminar asignatura.')
    });
  }
}