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

  // Variables para el modal de confirmación de eliminación física
  mostrarModalEliminar: boolean = false;
  usuarioAEliminar: any = null;

  formulario = {
    id: 0,
    nombre: '',
    segundo_nombre: '',
    apellido: '',
    segundo_apellido: '',
    email: '',
    rol_id: 0,
    rol_nombre: '',
    rut: '',
    fecha_nacimiento: '',
    curso_id: 0,
    asignatura_id: 0
  };

  private apiUrl = 'https://classbook-backend.onrender.com';

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
    this.usuariosFiltrados = this.usuarios.filter(u => {
      const nombreCompleto = `${u.usuario_nombre} ${u.usuario_segundo_nombre || ''} ${u.usuario_apellido} ${u.usuario_segundo_apellido || ''}`.toLowerCase();
      const curso = `${u.estudiante_curso || ''} ${u.docente_curso || ''}`.toLowerCase();
      const asignatura = `${u.docente_asignatura || ''}`.toLowerCase();

      return nombreCompleto.includes(texto) ||
        u.usuario_email.toLowerCase().includes(texto) ||
        u.rol_nombre.toLowerCase().includes(texto) ||
        curso.includes(texto) ||
        asignatura.includes(texto);
    });
  }

  abrirModalCrear() {
    this.modoEdicion = false;
    this.formulario = {
      id: 0, nombre: '', segundo_nombre: '', apellido: '', segundo_apellido: '',
      email: '', rol_id: 0, rol_nombre: '', rut: '', fecha_nacimiento: '', curso_id: 0, asignatura_id: 0
    };
    this.mensajeExito = '';
    this.mensajeError = '';
    this.mostrarModal = true;
  }

  abrirModalEditar(usuario: any) {
    this.modoEdicion = true;
    this.formulario = {
      id: usuario.usuario_id,
      nombre: usuario.usuario_nombre,
      segundo_nombre: usuario.usuario_segundo_nombre || '',
      apellido: usuario.usuario_apellido,
      segundo_apellido: usuario.usuario_segundo_apellido || '',
      email: usuario.usuario_email,
      rol_id: usuario.usuario_rol_id,
      rol_nombre: usuario.rol_nombre,
      rut: '', fecha_nacimiento: '', curso_id: 0, asignatura_id: 0
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

  // Abre el modal de confirmación de eliminación física
  abrirModalEliminar(usuario: any) {
    this.usuarioAEliminar = usuario;
    this.mostrarModalEliminar = true;
  }

  // Cierra el modal de confirmación de eliminación
  cerrarModalEliminar() {
    this.mostrarModalEliminar = false;
    this.usuarioAEliminar = null;
  }

  // Elimina físicamente el usuario y todos sus datos asociados en cascada
  eliminarUsuario() {
    if (!this.usuarioAEliminar) return;
    this.http.delete(`${this.apiUrl}/usuarios/${this.usuarioAEliminar.usuario_id}`, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        this.cerrarModalEliminar();
        this.cargarUsuarios();
      },
      error: (err) => {
        alert(err.error?.mensaje || 'Error al eliminar usuario.');
        this.cerrarModalEliminar();
      }
    });
  }

  guardarUsuario() {
    // Validaciones básicas en el frontend
    if (!this.formulario.nombre.trim() || !this.formulario.apellido.trim() || !this.formulario.email.trim() || this.formulario.rol_id === 0) {
      this.mensajeError = 'Primer nombre, primer apellido, correo y rol son obligatorios.';
      return;
    }

    // Validaciones adicionales para estudiante
    if (!this.modoEdicion && this.getRolNombre() === 'estudiante') {
      if (!this.formulario.rut.trim() || this.formulario.curso_id === 0) {
        this.mensajeError = 'RUT y curso son obligatorios para estudiantes.';
        return;
      }
    }

    // Validaciones adicionales para docente
    if (!this.modoEdicion && this.getRolNombre() === 'docente') {
      if (this.formulario.curso_id === 0 || this.formulario.asignatura_id === 0) {
        this.mensajeError = 'Curso y asignatura son obligatorios para docentes.';
        return;
      }
    }

    this.mensajeExito = '';
    this.mensajeError = '';
    this.cargando = true;

    if (this.modoEdicion) {
      this.http.put(`${this.apiUrl}/usuarios/${this.formulario.id}`,
        {
          nombre: this.formulario.nombre, segundo_nombre: this.formulario.segundo_nombre,
          apellido: this.formulario.apellido, segundo_apellido: this.formulario.segundo_apellido,
          email: this.formulario.email, rol_id: this.formulario.rol_id
        }, { headers: this.getHeaders() }
      ).subscribe({
        next: (res: any) => { this.mensajeExito = res.mensaje; this.cargarUsuarios(); this.cargando = false; },
        error: (err) => { this.mensajeError = err.error?.mensaje || 'Error al editar usuario.'; this.cargando = false; }
      });
    } else {
      const body: any = {
        nombre: this.formulario.nombre, segundo_nombre: this.formulario.segundo_nombre,
        apellido: this.formulario.apellido, segundo_apellido: this.formulario.segundo_apellido,
        email: this.formulario.email, rol_id: this.formulario.rol_id,
        rut: this.formulario.rut, fecha_nacimiento: this.formulario.fecha_nacimiento,
        curso_id: this.formulario.curso_id, asignatura_id: this.formulario.asignatura_id
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