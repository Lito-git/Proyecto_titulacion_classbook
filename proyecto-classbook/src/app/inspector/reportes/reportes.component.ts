import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LINKS_INSPECTOR } from '../../shared/navbar.links';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit, AfterViewInit, OnDestroy {

  links = LINKS_INSPECTOR;
  rutaBase = '/inspector';

  cursos: any[] = [];
  asignaturas: any[] = [];
  cursoSeleccionado: string = '';
  asignaturaSeleccionada: string = '';

  busquedaEstudiante: string = '';
  estudiantesResultado: any[] = [];
  estudianteSeleccionado: any = null;
  mostrarSugerencias: boolean = false;

  promedioGeneral: number = 0;
  promediosPorAsignatura: any[] = [];
  notasEstudiante: any[] = [];

  @ViewChild('graficoCanvas') graficoCanvas!: ElementRef;
  grafico: any = null;
  private resizeObserver: ResizeObserver | null = null;

  // Guardamos el timeout para poder cancelarlo
  private renderTimeout: any = null;

  private apiUrl = 'https://classbook-backend.onrender.com';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.cargarFiltros();
    this.cargarReportes();
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    if (this.renderTimeout) clearTimeout(this.renderTimeout);

    if (this.resizeObserver) this.resizeObserver.disconnect();

    if (this.grafico) this.grafico.destroy();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  cargarFiltros() {
    this.http.get<any[]>(`${this.apiUrl}/inspector/cursos`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.cursos = data,
      error: (err) => console.error('Error al cargar cursos', err)
    });
    this.http.get<any[]>(`${this.apiUrl}/inspector/asignaturas`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.asignaturas = data,
      error: (err) => console.error('Error al cargar asignaturas', err)
    });
  }

  cargarReportes() {
    // Cancelar timeout pendiente antes de lanzar uno nuevo
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
      this.renderTimeout = null;
    }

    let params: string[] = [];
    if (this.cursoSeleccionado) params.push(`curso_id=${this.cursoSeleccionado}`);

    if (this.asignaturaSeleccionada) params.push(`asignatura_id=${this.asignaturaSeleccionada}`);

    if (!this.estudianteSeleccionado && this.busquedaEstudiante) {
      params.push(`busqueda=${this.busquedaEstudiante}`);
    }
    if (this.estudianteSeleccionado) {
      params.push(`estudiante_id=${this.estudianteSeleccionado.estudiante_id}`);
    }

    const url = `${this.apiUrl}/inspector/reportes?${params.join('&')}`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.promedioGeneral = data.promedioGeneral;
        this.promediosPorAsignatura = data.promediosPorAsignatura;
        this.estudiantesResultado = data.estudiantes;
        this.notasEstudiante = data.notasEstudiante;

        // Forzar detección de cambios primero para que Angular
        // actualice el *ngIf y el canvas esté en el DOM antes de renderizar
        this.cdr.detectChanges();

        this.renderTimeout = setTimeout(() => this.renderizarGrafico(), 100);
      },
      error: (err) => console.error('Error al cargar reportes', err)
    });
  }

  buscarEstudiante() {
    if (this.busquedaEstudiante.length < 2) {
      this.estudiantesResultado = [];
      this.mostrarSugerencias = false;
      return;
    }
    this.mostrarSugerencias = true;
    this.cargarReportes();
  }

  seleccionarEstudiante(est: any) {
    this.estudianteSeleccionado = est;
    this.busquedaEstudiante = `${est.usuario_nombre} ${est.usuario_segundo_nombre || ''} ${est.usuario_apellido} ${est.usuario_segundo_apellido || ''}`.trim();
    this.mostrarSugerencias = false;
    this.estudiantesResultado = [];
    this.cargarReportes();
  }

  limpiarEstudiante() {
    this.estudianteSeleccionado = null;
    this.busquedaEstudiante = '';
    this.notasEstudiante = [];
    this.mostrarSugerencias = false;
    this.estudiantesResultado = [];
    this.cargarReportes();
  }

  getColorPromedio(): string {
    const p = parseFloat(this.promedioGeneral.toString());
    if (p >= 6.0) return 'linear-gradient(135deg, #16a34a, #22c55e)';
    if (p >= 5.0) return 'linear-gradient(135deg, #1a73e8, #3b82f6)';
    if (p >= 4.0) return 'linear-gradient(135deg, #e37400, #f59e0b)';
    return 'linear-gradient(135deg, #d93025, #ef4444)';
  }

  renderizarGrafico() {
    // Verificar que el canvas exista en el DOM en este momento
    if (!this.graficoCanvas?.nativeElement) return;

    const datos = this.estudianteSeleccionado && this.notasEstudiante.length > 0
      ? this.notasEstudiante
      : this.promediosPorAsignatura;

    // No renderizar si no hay datos
    if (!datos || datos.length === 0) return;

    if (this.grafico) {
      this.grafico.destroy();
      this.grafico = null;
    }

    const canvas = this.graficoCanvas.nativeElement;
    const wrapper = canvas.parentElement;

    const labels = datos.map((d: any) => d.asignatura_nombre);
    const promedios = datos.map((d: any) => parseFloat(d.promedio) || 0);

    const colores = promedios.map((p: number) => {
      if (p >= 6.0) return '#16a34a';
      if (p >= 5.0) return '#1a73e8';
      if (p >= 4.0) return '#e37400';
      return '#d93025';
    });

    this.grafico = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Promedio',
          data: promedios,
          backgroundColor: colores,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: 1, max: 7, ticks: { stepSize: 0.5 } } },
        plugins: { legend: { display: false } }
      }
    });

    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (this.grafico) {
          canvas.style.width = entry.contentRect.width + 'px';
          canvas.style.height = entry.contentRect.height + 'px';
          this.grafico.resize();
        }
      }
    });
    this.resizeObserver.observe(wrapper);
  }
}