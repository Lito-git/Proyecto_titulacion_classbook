// Importamos las dependencias necesarias
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LINKS_ESTUDIANTE } from '../../shared/navbar.links';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {

  // Links y ruta base para el navbar compartido
  links = LINKS_ESTUDIANTE;
  rutaBase = '/estudiante';

  // Datos del usuario
  nombre: string = sessionStorage.getItem('nombre') || '';

  // Variables para las tarjetas
  promedioGeneral: number = 0;
  totalAnotacionesPositivas: number = 0;
  totalEvaluacionesMes: number = 0;

  // Actividad reciente
  actividadReciente: any[] = [];

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarResumen();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private getUsuarioId(): number {
    const token = sessionStorage.getItem('token');
    return JSON.parse(atob(token!.split('.')[1])).id;
  }

  // Carga el resumen del dashboard
  cargarResumen() {
    const id = this.getUsuarioId();
    this.http.get<any>(`${this.apiUrl}/estudiante/${id}/resumen`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.promedioGeneral = data.promedioGeneral;
        this.totalAnotacionesPositivas = data.totalAnotacionesPositivas;
        this.totalEvaluacionesMes = data.totalEvaluacionesMes;
        this.actividadReciente = data.actividadReciente;
      },
      error: (err) => console.error('Error al cargar resumen', err)
    });
  }

  // Formatea el tiempo relativo (hace X horas/días)
  tiempoRelativo(fecha: string): string {
    const ahora = new Date();
    const fechaEvento = new Date(fecha);
    const diffMs = ahora.getTime() - fechaEvento.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffHoras / 24);

    if (diffHoras < 1) return 'Hace menos de 1 hora';
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias === 1) return 'Hace 1 día';
    return `Hace ${diffDias} días`;
  }
}