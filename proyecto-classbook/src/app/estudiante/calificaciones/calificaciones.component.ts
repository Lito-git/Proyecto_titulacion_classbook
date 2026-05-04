import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LINKS_ESTUDIANTE } from '../../shared/navbar.links';
import Chart from 'chart.js/auto';
import { FIRMA_DIRECTOR, TIMBRE_DIRECTOR } from '../../shared/images.constants';

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './calificaciones.component.html',
  styleUrl: './calificaciones.component.css'
})
export class CalificacionesComponent implements OnInit, AfterViewInit, OnDestroy {

  links = LINKS_ESTUDIANTE;
  rutaBase = '/estudiante';

  asignaturas: any[] = [];
  promedioGeneral: number = 0;
  mostrarGrafico: boolean = false;

  @ViewChild('graficoCanvas') graficoCanvas!: ElementRef;
  grafico: any = null;
  private resizeObserver: ResizeObserver | null = null;

  private apiUrl = 'https://classbook-backend.onrender.com';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarCalificaciones();
  }

  ngAfterViewInit() { }

  // Limpia el gráfico y el observer al destruir el componente
  ngOnDestroy() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.grafico) this.grafico.destroy();
  }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private getUsuarioId(): number {
    const token = sessionStorage.getItem('token');
    return JSON.parse(atob(token!.split('.')[1])).id;
  }

  cargarCalificaciones() {
    const id = this.getUsuarioId();
    this.http.get<any>(`${this.apiUrl}/estudiante/${id}/calificaciones`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.asignaturas = data.asignaturas;
        this.promedioGeneral = data.promedioGeneral;
        setTimeout(() => this.renderizarGrafico(), 100);
      },
      error: (err) => console.error('Error al cargar calificaciones', err)
    });
  }

  renderizarGrafico() {
    if (!this.graficoCanvas || !this.mostrarGrafico) return;

    // Destruir gráfico anterior si existe
    if (this.grafico) {
      this.grafico.destroy();
      this.grafico = null;
    }

    const canvas = this.graficoCanvas.nativeElement;
    const wrapper = canvas.parentElement;

    const labels = this.asignaturas.map(a => a.asignatura_nombre);
    const promedios = this.asignaturas.map(a => parseFloat(a.promedio) || 0);

    const colores = promedios.map(p => {
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
          label: 'Promedio por asignatura',
          data: promedios,
          backgroundColor: colores,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 2,
            max: 7,
            ticks: { stepSize: 0.5 }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    // ResizeObserver para que el gráfico sea responsivo
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

  toggleGrafico() {
    this.mostrarGrafico = !this.mostrarGrafico;
    if (this.mostrarGrafico) {
      setTimeout(() => this.renderizarGrafico(), 100);
    } else {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      if (this.grafico) {
        this.grafico.destroy();
        this.grafico = null;
      }
    }
  }

  getNota(calificaciones: any[], tipo: string, numero: number): string {
    const cal = calificaciones.find(c => c.calificacion_tipo === tipo && c.calificacion_numero === numero);
    return cal ? cal.calificacion_nota : '-';
  }

  getClaseNota(nota: any): string {
    const n = parseFloat(nota);
    if (isNaN(n)) return '';
    if (n >= 6.0) return 'nota-excelente';
    if (n >= 5.0) return 'nota-bueno';
    if (n >= 4.0) return 'nota-suficiente';
    return 'nota-insuficiente';
  }

  descargarPDF() {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      const nombre = sessionStorage.getItem('nombre') || '';
      const segundoNombre = sessionStorage.getItem('segundo_nombre') || '';
      const apellido = sessionStorage.getItem('apellido') || '';
      const segundoApellido = sessionStorage.getItem('segundo_apellido') || '';
      const curso = sessionStorage.getItem('curso') || '';
      const fecha = new Date().toLocaleDateString('es-CL');
      const anio = new Date().getFullYear();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const centerX = pageWidth / 2;

      const nombreCompleto = [nombre, segundoNombre, apellido, segundoApellido]
        .filter(v => v.trim() !== '')
        .join(' ');

      doc.setFillColor(23, 45, 68);
      doc.rect(0, 0, pageWidth, 38, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('COLEGIO CRUZ DEL SUR', centerX, 14, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Certificado De Concentración De Notas — Año Escolar ' + anio, centerX, 22, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      doc.setFillColor(240, 244, 255);
      doc.rect(14, 44, pageWidth - 28, 32, 'F');
      doc.setDrawColor(23, 45, 68);
      doc.setLineWidth(0.3);
      doc.rect(14, 44, pageWidth - 28, 32, 'S');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS DEL ESTUDIANTE', 20, 52);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Nombre completo:`, 20, 60);
      doc.setFont('helvetica', 'bold');
      doc.text(`${nombreCompleto}`, 62, 60);

      doc.setFont('helvetica', 'normal');
      doc.text(`Curso:`, 20, 68);
      doc.setFont('helvetica', 'bold');
      doc.text(`${curso}`, 62, 68);

      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de emisión:`, 120, 60);
      doc.setFont('helvetica', 'bold');
      doc.text(`${fecha}`, 162, 60);

      doc.setFont('helvetica', 'normal');
      doc.text(`Promedio general:`, 120, 68);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${this.promedioGeneral}`, 162, 68);

      let y = 88;

      doc.setFillColor(23, 45, 68);
      doc.rect(14, y - 6, pageWidth - 28, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('ASIGNATURA', 20, y);
      doc.text('P1', 105, y, { align: 'center' });
      doc.text('P2', 120, y, { align: 'center' });
      doc.text('P3', 135, y, { align: 'center' });
      doc.text('ACT.', 150, y, { align: 'center' });
      doc.text('EXAMEN', 165, y, { align: 'center' });
      doc.text('PROMEDIO', 185, y, { align: 'center' });

      y += 6;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);

      this.asignaturas.forEach((asig, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 255);
          doc.rect(14, y - 5, pageWidth - 28, 9, 'F');
        }

        const promedio = parseFloat(asig.promedio);
        if (!isNaN(promedio) && promedio < 4.0) {
          doc.setTextColor(180, 0, 0);
        } else {
          doc.setTextColor(0, 0, 0);
        }

        doc.setFont('helvetica', 'normal');
        doc.text(asig.asignatura_nombre.substring(0, 42), 20, y);
        doc.setTextColor(0, 0, 0);
        doc.text(this.getNota(asig.calificaciones, 'prueba', 1).toString(), 105, y, { align: 'center' });
        doc.text(this.getNota(asig.calificaciones, 'prueba', 2).toString(), 120, y, { align: 'center' });
        doc.text(this.getNota(asig.calificaciones, 'prueba', 3).toString(), 135, y, { align: 'center' });
        doc.text(this.getNota(asig.calificaciones, 'actividad', 1).toString(), 150, y, { align: 'center' });
        doc.text(this.getNota(asig.calificaciones, 'examen', 1).toString(), 165, y, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        if (!isNaN(promedio) && promedio < 4.0) doc.setTextColor(180, 0, 0);
        doc.text(asig.promedio?.toString() || '-', 185, y, { align: 'center' });
        doc.setTextColor(0, 0, 0);

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(14, y + 4, 196, y + 4);

        y += 10;
      });

      doc.setDrawColor(20, 40, 100);
      doc.setLineWidth(0.3);
      doc.rect(14, 82, pageWidth - 28, y - 82, 'S');

      y += 4;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text('* Calificación mínima de aprobación (4.0)', 14, y);
      doc.text('* ACT. = Actividades  |  Escala de evaluación: 2.0 a 7.0', 14, y + 5);
      doc.text('* EXAM. = Examen  |  Escala de evaluación: 2.0 a 7.0', 14, y + 10);
      doc.text('* P1, P2, P3 = Pruebas  |  Escala de evaluación: 2.0 a 7.0', 14, y + 15);

      const firmasY = pageHeight - 50;

      doc.setTextColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);

      doc.addImage(FIRMA_DIRECTOR, 'PNG', centerX - 30, firmasY - 28, 60, 22);

      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);
      doc.line(centerX - 35, firmasY, centerX + 35, firmasY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('JORGE RAMIRO GONZALEZ ECHEVERRIA', centerX, firmasY + 6, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('DIRECTOR COLEGIO CRUZ DEL SUR ', centerX, firmasY + 11, { align: 'center' });

      doc.addImage(TIMBRE_DIRECTOR, 'PNG', centerX + 5, firmasY - 45, 45, 45);

      doc.setFillColor(23, 45, 68);
      doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Colegio Cruz del Sur  •  Documento generado en plataforma ClassBook y de uso interno del establecimiento el ${fecha}  •  Año Escolar ${anio}`,
        centerX, pageHeight - 6, { align: 'center' }
      );

      doc.save(`Certificado_Concentracion_Notas_${nombreCompleto}.pdf`);
    });
  }
}