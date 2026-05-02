// Importamos las dependencias necesarias
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LINKS_ADMINISTRADOR } from '../../shared/navbar.links';

@Component({
  selector: 'app-asignaturas',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './asignaturas.component.html',
  styleUrl: './asignaturas.component.css'
})
export class AsignaturasComponent implements OnInit {

  links = LINKS_ADMINISTRADOR;
  rutaBase = '/administrador';

  asignaturas: any[] = [];
  cargando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';
  mostrarModal: boolean = false;
  modoEdicion: boolean = false;

  formulario = { id: 0, nombre: '', descripcion: '' };

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  ngOnInit() { this.cargarAsignaturas(); }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  cargarAsignaturas() {
    this.http.get<any[]>(`${this.apiUrl}/asignaturas`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.asignaturas = data,
      error: () => this.mensajeError = 'Error al cargar asignaturas.'
    });
  }

  abrirModalCrear() {
    this.modoEdicion = false;
    this.formulario = { id: 0, nombre: '', descripcion: '' };
    this.mensajeExito = '';
    this.mensajeError = '';
    this.mostrarModal = true;
  }

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

  cerrarModal() {
    this.mostrarModal = false;
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  guardarAsignatura() {
    this.mensajeExito = '';
    this.mensajeError = '';

    // Validamos que el nombre de la asignatura no esté vacío
    if (!this.formulario.nombre.trim()) {
      this.mensajeError = 'El nombre de la asignatura es obligatorio.';
      return;
    }

    this.cargando = true;

    if (this.modoEdicion) {
      this.http.put(`${this.apiUrl}/asignaturas/${this.formulario.id}`,
        { nombre: this.formulario.nombre, descripcion: this.formulario.descripcion },
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res: any) => { this.mensajeExito = res.mensaje; this.cargarAsignaturas(); this.cargando = false; },
        error: (err) => { this.mensajeError = err.error?.mensaje || 'Error al editar asignatura.'; this.cargando = false; }
      });
    } else {
      this.http.post(`${this.apiUrl}/asignaturas`,
        { nombre: this.formulario.nombre, descripcion: this.formulario.descripcion },
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res: any) => { this.mensajeExito = res.mensaje; this.cargarAsignaturas(); this.cargando = false; },
        error: (err) => { this.mensajeError = err.error?.mensaje || 'Error al crear asignatura.'; this.cargando = false; }
      });
    }
  }

  eliminarAsignatura(id: number) {
    if (!confirm('¿Estás seguro de eliminar esta asignatura?')) return;
    this.http.delete(`${this.apiUrl}/asignaturas/${id}`, { headers: this.getHeaders() }).subscribe({
      next: () => this.cargarAsignaturas(),
      error: (err) => alert(err.error?.mensaje || 'Error al eliminar asignatura.')
    });
  }
}