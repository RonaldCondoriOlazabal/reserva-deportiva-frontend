import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CanchaMetadataService } from '../../core/cancha-metadata.service';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';

@Component({
  selector: 'app-admin-reportes',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Administrador / <span>Reportes</span></nav>
      <h1 class="page-title">Reportes del Sistema</h1>
      <p class="page-subtitle">Métricas y estadísticas generales</p>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div></div>
    } @else {
      <div class="stats-grid">
        <app-stat-card icon="📅" label="Total Reservas" [value]="reporte.totalReservas" color="#6366F1" />
        <app-stat-card icon="💰" label="Ingresos Totales" [value]="'S/ ' + reporte.ingresos" color="#10B981" />
        <app-stat-card icon="✅" label="Pagos Aprobados" [value]="reporte.pagosOk" color="#059669" />
        <app-stat-card icon="❌" label="Pagos Rechazados" [value]="reporte.pagosFail" color="#EF4444" />
      </div>

      <div class="reports-grid">
        <div class="card">
          <div class="card-body">
            <h3>Reservas por estado</h3>
            @for (item of reporte.reservasPorEstado; track item.estado) {
              <div class="bar-row">
                <span>{{ item.estado }}</span>
                <div class="bar-track"><div class="bar-fill" [style.width.%]="item.pct"></div></div>
                <strong>{{ item.count }}</strong>
              </div>
            }
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h3>Canchas por deporte</h3>
            @for (item of reporte.canchasPorTipo; track item.tipo) {
              <div class="bar-row">
                <span>{{ item.tipo }}</span>
                <div class="bar-track"><div class="bar-fill sport" [style.width.%]="item.pct"></div></div>
                <strong>{{ item.count }}</strong>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }
    .reports-grid h3 { margin-bottom: 20px; font-size: 1rem; }
    .bar-row {
      display: grid;
      grid-template-columns: 100px 1fr 40px;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 0.875rem;
    }
    .bar-track {
      height: 8px;
      background: var(--color-bg);
      border-radius: 999px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: #6366F1;
      border-radius: 999px;
      transition: width 0.6s ease;
    }
    .bar-fill.sport { background: var(--color-accent); }
  `]
})
export class AdminReportesComponent implements OnInit {
  loading = signal(true);
  reporte = {
    totalReservas: 0,
    ingresos: '0.00',
    pagosOk: 0,
    pagosFail: 0,
    reservasPorEstado: [] as { estado: string; count: number; pct: number }[],
    canchasPorTipo: [] as { tipo: string; count: number; pct: number }[]
  };

  constructor(private api: ApiService, private meta: CanchaMetadataService) {}

  ngOnInit(): void {
    forkJoin({
      reservas: this.api.getReservas(),
      pagos: this.api.getPagos(),
      canchas: this.api.getCanchas()
    }).subscribe({
      next: ({ reservas, pagos, canchas }) => {
        this.reporte.totalReservas = reservas.length;
        const aprobados = pagos.filter(p => p.estado === 'APROBADO');
        this.reporte.pagosOk = aprobados.length;
        this.reporte.pagosFail = pagos.filter(p => p.estado === 'RECHAZADO').length;
        this.reporte.ingresos = aprobados.reduce((s, p) => s + Number(p.monto), 0).toFixed(2);

        const estados = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA'];
        const maxR = Math.max(reservas.length, 1);
        this.reporte.reservasPorEstado = estados.map(e => ({
          estado: e,
          count: reservas.filter(r => r.estado === e).length,
          pct: (reservas.filter(r => r.estado === e).length / maxR) * 100
        }));

        const tipos = [...new Set(canchas.map(c => c.tipo))];
        const maxC = Math.max(canchas.length, 1);
        this.reporte.canchasPorTipo = tipos.map(t => ({
          tipo: t,
          count: canchas.filter(c => c.tipo === t).length,
          pct: (canchas.filter(c => c.tipo === t).length / maxC) * 100
        }));

        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
