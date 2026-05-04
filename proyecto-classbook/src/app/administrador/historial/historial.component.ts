import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LINKS_ADMINISTRADOR } from '../../shared/navbar.links';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.css'
})
export class HistorialComponent implements OnInit {

  // Links y ruta base para el navbar compartido
  links = LINKS_ADMINISTRADOR;
  rutaBase = '/administrador';

  // Datos del historial
  historial: any[] = [];
  historialFiltrado: any[] = [];
  usuarios: any[] = [];

  // Variables de filtros
  filtroTipo: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Variables para el buscador de usuarios
  busquedaUsuario: string = '';
  usuariosFiltrados: any[] = [];
  usuarioSeleccionado: any = null;
  mostrarSugerencias: boolean = false;
  filtroUsuario: string = '';

  private apiUrl = 'https://classbook-backend.onrender.com';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarHistorial();
    this.cargarUsuarios();
  }

  // Obtiene el token para los headers de las peticiones
  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Carga el historial completo desde el backend
  cargarHistorial() {
    this.http.get<any[]>(`${this.apiUrl}/historial`, { headers: this.getHeaders() }).subscribe({
      next: (data) => { this.historial = data; this.historialFiltrado = data; },
      error: (err) => console.error('Error al cargar historial', err)
    });
  }

  // Carga los usuarios para el buscador
  cargarUsuarios() {
    this.http.get<any[]>(`${this.apiUrl}/usuarios`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.usuarios = data
    });
  }

  // Filtra usuarios en el buscador
  filtrarUsuarios() {
    const texto = this.busquedaUsuario.toLowerCase();
    if (texto.length < 2) {
      this.usuariosFiltrados = [];
      this.mostrarSugerencias = false;
      return;
    }
    this.usuariosFiltrados = this.usuarios.filter(u => {
      const nombreCompleto = `${u.usuario_nombre} ${u.usuario_segundo_nombre || ''} ${u.usuario_apellido} ${u.usuario_segundo_apellido || ''}`.toLowerCase();
      return nombreCompleto.includes(texto);
    });
    this.mostrarSugerencias = true;
  }

  // Selecciona un usuario desde las sugerencias
  seleccionarUsuario(usuario: any) {
    this.usuarioSeleccionado = usuario;
    this.filtroUsuario = usuario.usuario_id;
    this.busquedaUsuario = `${usuario.usuario_nombre} ${usuario.usuario_segundo_nombre || ''} ${usuario.usuario_apellido} ${usuario.usuario_segundo_apellido || ''}`.trim();
    this.mostrarSugerencias = false;
    this.usuariosFiltrados = [];
    this.aplicarFiltros();
  }

  // Limpia la selección del usuario
  limpiarUsuario() {
    this.usuarioSeleccionado = null;
    this.filtroUsuario = '';
    this.busquedaUsuario = '';
    this.usuariosFiltrados = [];
    this.mostrarSugerencias = false;
    this.aplicarFiltros();
  }

  // Aplica los filtros seleccionados enviando query params al backend
  aplicarFiltros() {
    const params: any = {};
    if (this.filtroTipo) params.tipo = this.filtroTipo;
    if (this.filtroUsuario) params.usuario_id = this.filtroUsuario;
    if (this.filtroFechaInicio) params.fecha_inicio = this.filtroFechaInicio;
    if (this.filtroFechaFin) params.fecha_fin = this.filtroFechaFin;

    const queryString = new URLSearchParams(params).toString();
    const url = `${this.apiUrl}/historial${queryString ? '?' + queryString : ''}`;

    this.http.get<any[]>(url, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.historialFiltrado = data,
      error: (err) => console.error('Error al filtrar historial', err)
    });
  }

  // Limpia todos los filtros y restaura el historial completo
  limpiarFiltros() {
    this.filtroTipo = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.limpiarUsuario();
  }

  // Formatea la fecha al formato dd-mm-yyyy hh:mm:ss a.m/p.m
  formatearFecha(fecha: string): string {
    const d = new Date(fecha);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();
    let horas = d.getHours();
    const minutos = d.getMinutes().toString().padStart(2, '0');
    const segundos = d.getSeconds().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
    horas = horas % 12 || 12;
    return `${dia}-${mes}-${anio}, ${horas}:${minutos}:${segundos} ${ampm}`;
  }

  // Separa el título del detalle usando el separador |
  getTitulo(detalle: string): string {
    return detalle?.includes('|') ? detalle.split('|')[0] : detalle;
  }

  // Separa el detalle del título usando el separador |
  getDetalle(detalle: string): string {
    return detalle?.includes('|') ? detalle.split('|')[1] : '';
  }
}