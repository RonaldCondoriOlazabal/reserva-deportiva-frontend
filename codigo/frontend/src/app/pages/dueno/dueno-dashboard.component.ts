import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CanchaMetadataService } from '../../core/cancha-metadata.service';
import { KeycloakService } from '../../core/keycloak.service';
import { ReservaPagoService } from '../../core/reserva-pago.service';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';

@Component({
  selector: 'app-dueno-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Dueño / <span>Panel</span></nav>
      <h1 class="page-title">Mi Panel</h1>
      <p class="page-subtitle">Resumen de tus canchas e ingresos</p>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div></div>
    } @else {
      <div class="stats-grid">
        <app-stat-card icon="🏟️" label="Canchas Aprobadas" [value]="stats.canchas" color="#F59E0B" />
        <app-stat-card icon="📅" label="Total Reservas" [value]="stats.reservas" color="#6366F1" />
        <app-stat-card icon="💰" label="Ingresos" [value]="'S/ ' + stats.ingresos" color="#10B981" />
        <app-stat-card icon="⏳" label="Solicitudes Pendientes" [value]="stats.pendientes" color="#EF4444" />
      </div>
    }
  `
})
export class DuenoDashboardComponent implements OnInit {
  loading = signal(true);
  stats = { canchas: 0, reservas: 0, ingresos: '0.00', pendientes: 0 };

  constructor(
    private api: ApiService,
    private meta: CanchaMetadataService,
    private kc: KeycloakService,
    private rp: ReservaPagoService
  ) {}

  ngOnInit(): void {
    const user = this.kc.getUsername() ?? '';
    forkJoin({ canchas: this.api.getCanchas(), reservas: this.api.getReservas(), pagos: this.api.getPagos() }).subscribe({
      next: ({ canchas, reservas, pagos }) => {
        const misCanchas = this.meta.getCanchasByOwner(user, canchas);
        const ids = new Set(misCanchas.map(c => c.id));
        const misReservas = reservas.filter(r => ids.has(r.idCancha));
        const reservaIds = new Set(misReservas.map(r => r.id));
        const ingresos = pagos
          .filter(p => this.rp.esPagoVisible(p) && p.estado === 'APROBADO' && reservaIds.has(p.idReserva))
          .reduce((s, p) => s + Number(p.monto), 0);

        this.stats.canchas = misCanchas.length;
        this.stats.reservas = misReservas.length;
        this.stats.ingresos = ingresos.toFixed(2);
        this.stats.pendientes = this.meta.getSolicitudesByOwner(user).filter(s => s.estado === 'PENDIENTE').length;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
