// Importamos las dependencias necesarias
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.css'
})
export class HistorialComponent implements OnInit {

  historial: any[] = [];
  historialFiltrado: any[] = [];
  usuarios: any[] = [];

  // Filtros
  filtroTipo: string = '';
  filtroUsuario: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarHistorial();
    this.cargarUsuarios();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Carga el historial completo desde el backend
  cargarHistorial() {
    this.http.get<any[]>(`${this.apiUrl}/historial`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.historial = data;
        this.historialFiltrado = data;
      },
      error: (err) => console.error('Error al cargar historial', err)
    });
  }

  // Carga los usuarios para el filtro de usuario
  cargarUsuarios() {
    this.http.get<any[]>(`${this.apiUrl}/usuarios`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.usuarios = data
    });
  }

  // Aplica los filtros al historial
  aplicarFiltros() {
    const params: any = {};
    if (this.filtroTipo) params.tipo = this.filtroTipo;
    if (this.filtroUsuario) params.usuario_id = this.filtroUsuario;
    if (this.filtroFechaInicio) params.fecha_inicio = this.filtroFechaInicio;
    if (this.filtroFechaFin) params.fecha_fin = this.filtroFechaFin;

    // Construimos los query params para el backend
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.apiUrl}/historial${queryString ? '?' + queryString : ''}`;

    this.http.get<any[]>(url, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.historialFiltrado = data,
      error: (err) => console.error('Error al filtrar historial', err)
    });
  }

  // Limpia todos los filtros
  limpiarFiltros() {
    this.filtroTipo = '';
    this.filtroUsuario = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.historialFiltrado = this.historial;
  }

  // Separa el título del detalle usando el separador |
  getTitulo(detalle: string): string {
    return detalle.includes('|') ? detalle.split('|')[0] : detalle;
  }

  getDetalle(detalle: string): string {
    return detalle.includes('|') ? detalle.split('|')[1] : '';
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
}