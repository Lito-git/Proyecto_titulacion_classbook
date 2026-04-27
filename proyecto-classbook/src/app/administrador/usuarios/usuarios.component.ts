// Importamos las dependencias necesarias
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {

  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  roles: any[] = [];
  cursos: any[] = [];
  asignaturas: any[] = [];
  busqueda: string = '';
  cargando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  // Control del formulario modal
  mostrarModal: boolean = false;
  modoEdicion: boolean = false;

  // Datos del formulario
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

  // Obtiene el token para los headers de las peticiones
  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Carga todos los usuarios desde el backend
  cargarUsuarios() {
    this.http.get<any[]>(`${this.apiUrl}/usuarios`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.filtrar();
      },
      error: () => this.mensajeError = 'Error al cargar usuarios.'
    });
  }

  // Carga los roles disponibles
  cargarRoles() {
    this.http.get<any[]>(`${this.apiUrl}/usuarios/roles`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.roles = data
    });
  }

  // Carga los cursos disponibles
  cargarCursos() {
    this.http.get<any[]>(`${this.apiUrl}/cursos`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.cursos = data
    });
  }

  // Carga las asignaturas disponibles
  cargarAsignaturas() {
    this.http.get<any[]>(`${this.apiUrl}/asignaturas`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.asignaturas = data
    });
  }

  // Retorna el nombre del rol seleccionado en el formulario
  getRolNombre(): string {
    const rol = this.roles.find(r => r.rol_id == this.formulario.rol_id); // == en lugar de === para comparar sin tipo
    return rol ? rol.rol_nombre : '';
  }

  // Filtra usuarios según el texto de búsqueda
  filtrar() {
    const texto = this.busqueda.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(u =>
      u.usuario_nombre.toLowerCase().includes(texto) ||
      u.usuario_apellido.toLowerCase().includes(texto) ||
      u.usuario_email.toLowerCase().includes(texto) ||
      u.rol_nombre.toLowerCase().includes(texto)
    );
  }

  // Abre el modal para crear un nuevo usuario
  abrirModalCrear() {
    this.modoEdicion = false;
    this.formulario = { id: 0, nombre: '', apellido: '', email: '', rol_id: 0, rol_nombre: '', rut: '', fecha_nacimiento: '', curso_id: 0, asignatura_id: 0 };
    this.mensajeExito = '';
    this.mensajeError = '';
    this.mostrarModal = true;
  }

  // Abre el modal para editar un usuario existente
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

  // Cierra el modal
  cerrarModal() {
    this.mostrarModal = false;
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  // Guarda el usuario (crear o editar según el modo)
  guardarUsuario() {
    this.mensajeExito = '';
    this.mensajeError = '';
    this.cargando = true;

    if (this.modoEdicion) {
      // Editar usuario existente
      this.http.put(`${this.apiUrl}/usuarios/${this.formulario.id}`,
        { nombre: this.formulario.nombre, apellido: this.formulario.apellido, email: this.formulario.email, rol_id: this.formulario.rol_id },
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res: any) => {
          this.mensajeExito = res.mensaje;
          this.cargarUsuarios();
          this.cargando = false;
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al editar usuario.';
          this.cargando = false;
        }
      });
    } else {
      // Crear nuevo usuario
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
        next: (res: any) => {
          this.mensajeExito = res.mensaje;
          this.cargarUsuarios();
          this.cargando = false;
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al crear usuario.';
          this.cargando = false;
        }
      });
    }
  }

  // Resetea la contraseña de un usuario
  resetearContrasena(id: number) {
    if (!confirm('¿Estás seguro de resetear la contraseña de este usuario?')) return;
    this.http.post(`${this.apiUrl}/usuarios/${id}/resetear-contrasena`, {}, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => alert(res.mensaje),
      error: (err) => alert(err.error?.mensaje || 'Error al resetear contraseña.')
    });
  }

  // Activa o desactiva un usuario
  toggleActivo(id: number) {
    this.http.patch(`${this.apiUrl}/usuarios/${id}/toggle-activo`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => alert(err.error?.mensaje || 'Error al cambiar estado del usuario.')
    });
  }
}