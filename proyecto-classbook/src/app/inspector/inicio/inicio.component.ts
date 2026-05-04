import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LINKS_INSPECTOR } from '../../shared/navbar.links';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {

  // Links y ruta base para el navbar compartido
  links = LINKS_INSPECTOR;
  rutaBase = '/inspector';

  // Datos del usuario
  nombre: string = sessionStorage.getItem('nombre') || '';

  // Variables para las tarjetas
  promedioGeneral: number = 0;
  anotacionesPositivasMes: number = 0;
  anotacionesNegativasMes: number = 0;
  casosSeguimiento: number = 0;

  // Rendimiento por curso
  cursos: any[] = [];

  // Alertas recientes
  alertasNegativas: any[] = [];
  alertasRendimiento: any[] = [];

  private apiUrl = 'https://classbook-backend.onrender.com';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarResumen();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Carga el resumen del dashboard
  cargarResumen() {
    this.http.get<any>(`${this.apiUrl}/inspector/resumen`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.promedioGeneral = data.promedioGeneral;
        this.anotacionesPositivasMes = data.anotacionesPositivasMes;
        this.anotacionesNegativasMes = data.anotacionesNegativasMes;
        this.casosSeguimiento = data.casosSeguimiento;
        this.cursos = data.cursos;
        this.alertasNegativas = data.alertasNegativas;
        this.alertasRendimiento = data.alertasRendimiento;
      },
      error: (err) => console.error('Error al cargar resumen', err)
    });
  }

  // Construye el nombre completo
  getNombreCompleto(item: any): string {
    return `${item.usuario_nombre}${item.usuario_segundo_nombre ? ' ' + item.usuario_segundo_nombre : ''} ${item.usuario_apellido}${item.usuario_segundo_apellido ? ' ' + item.usuario_segundo_apellido : ''}`.trim();
  }

  // Formatea la fecha relativa
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