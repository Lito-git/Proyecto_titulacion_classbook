// Importamos las dependencias necesarias
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LINKS_ADMINISTRADOR } from '../../shared/navbar.links';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {

  links = LINKS_ADMINISTRADOR;
  rutaBase = '/administrador';

  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  roles: any[] = [];
  cursos: any[] = [];
  asignaturas: any[] = [];
  busqueda: string = '';
  cargando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';
  mostrarModal: boolean = false;
  modoEdicion: boolean = false;

  formulario = {
    id: 0,
    nombre: '',
    apellido: '',
    email: '',
    rol_id: 0,
    rol_nombre: '',
    rut: '',
    fecha_nacimiento: '',
    curso_id: 0,
    asignatura_id: 0
  };

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarRoles();
    this.cargarCursos();
    this.cargarAsignaturas();
    this.cargarUsuarios();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  cargarUsuarios() {
    this.http.get<any[]>(`${this.apiUrl}/usuarios`, { headers: this.getHeaders() }).subscribe({
      next: (data) => { this.usuarios = data; this.filtrar(); },
      error: () => this.mensajeError = 'Error al cargar usuarios.'
    });
  }

  cargarRoles() {
    this.http.get<any[]>(`${this.apiUrl}/usuarios/roles`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.roles = data
    });
  }

  cargarCursos() {
    this.http.get<any[]>(`${this.apiUrl}/cursos`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.cursos = data
    });
  }

  cargarAsignaturas() {
    this.http.get<any[]>(`${this.apiUrl}/asignaturas`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.asignaturas = data
    });
  }

  getRolNombre(): string {
    const rol = this.roles.find(r => r.rol_id == this.formulario.rol_id);
    return rol ? rol.rol_nombre : '';
  }

  filtrar() {
    const texto = this.busqueda.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(u =>
      u.usuario_nombre.toLowerCase().includes(texto) ||
      u.usuario_apellido.toLowerCase().includes(texto) ||
      u.usuario_email.toLowerCase().includes(texto) ||
      u.rol_nombre.toLowerCase().includes(texto)
    );
  }

  abrirModalCrear() {
    this.modoEdicion = false;
    this.formulario = { id: 0, nombre: '', apellido: '', email: '', rol_id: 0, rol_nombre: '', rut: '', fecha_nacimiento: '', curso_id: 0, asignatura_id: 0 };
    this.mensajeExito = '';
    this.mensajeError = '';
    this.mostrarModal = true;
  }

  abrirModalEditar(usuario: any) {
    this.modoEdicion = true;
    this.formulario = {
      id: usuario.usuario_id,
      nombre: usuario.usuario_nombre,
      apellido: usuario.usuario_apellido,
      email: usuario.usuario_email,
      rol_id: usuario.usuario_rol_id,
      rol_nombre: usuario.rol_nombre,
      rut: '',
      fecha_nacimiento: '',
      curso_id: 0,
      asignatura_id: 0
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

  guardarUsuario() {
    this.mensajeExito = '';
    this.mensajeError = '';
    this.cargando = true;

    if (this.modoEdicion) {
      this.http.put(`${this.apiUrl}/usuarios/${this.formulario.id}`,
        { nombre: this.formulario.nombre, apellido: this.formulario.apellido, email: this.formulario.email, rol_id: this.formulario.rol_id },
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res: any) => { this.mensajeExito = res.mensaje; this.cargarUsuarios(); this.cargando = false; },
        error: (err) => { this.mensajeError = err.error?.mensaje || 'Error al editar usuario.'; this.cargando = false; }
      });
    } else {
      const body: any = {
        nombre: this.formulario.nombre,
        apellido: this.formulario.apellido,
        email: this.formulario.email,
        rol_id: this.formulario.rol_id,
        rut: this.formulario.rut,
        fecha_nacimiento: this.formulario.fecha_nacimiento,
        curso_id: this.formulario.curso_id,
        asignatura_id: this.formulario.asignatura_id
      };
      this.http.post(`${this.apiUrl}/usuarios`, body, { headers: this.getHeaders() }).subscribe({
        next: (res: any) => { this.mensajeExito = res.mensaje; this.cargarUsuarios(); this.cargando = false; },
        error: (err) => { this.mensajeError = err.error?.mensaje || 'Error al crear usuario.'; this.cargando = false; }
      });
    }
  }

  resetearContrasena(id: number) {
    if (!confirm('¿Estás seguro de resetear la contraseña de este usuario?')) return;
    this.http.post(`${this.apiUrl}/usuarios/${id}/resetear-contrasena`, {}, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => alert(res.mensaje),
      error: (err) => alert(err.error?.mensaje || 'Error al resetear contraseña.')
    });
  }

  toggleActivo(id: number) {
    this.http.patch(`${this.apiUrl}/usuarios/${id}/toggle-activo`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => alert(err.error?.mensaje || 'Error al cambiar estado del usuario.')
    });
  }
}