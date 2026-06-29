import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { CanchaMetadataService } from '../../core/cancha-metadata.service';
import { KeycloakService } from '../../core/keycloak.service';
import { CourtCardComponent } from '../../shared/court-card/court-card.component';
import { CanchaEnriquecida, SolicitudCancha } from '../../core/models/cancha.model';

@Component({
  selector: 'app-dueno-mis-canchas',
  standalone: true,
  imports: [CommonModule, CourtCardComponent],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Dueño / <span>Mis Canchas</span></nav>
      <h1 class="page-title">Mis Canchas</h1>
      <p class="page-subtitle">Puedes registrar más canchas de fútbol o vóley desde "Registrar cancha"</p>
    </div>

    <div class="info-banner card" style="margin-bottom:24px">
      <div class="card-body">
        <strong>💡 ¿Más canchas en tu complejo?</strong>
        <p>Envía una nueva solicitud por cada cancha adicional. Una vez aprobada, configura sus horarios en la sección <strong>Horarios</strong>.</p>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div></div>
    } @else {
      @if (pendientes().length) {
        <h3 class="section-title">⏳ Solicitudes pendientes</h3>
        <div class="courts-grid" style="margin-bottom:32px">
          @for (s of pendientes(); track s.id) {
            <article class="pending-card">
              <img [src]="s.imagenUrl" [alt]="s.nombre" />
              <div class="pending-body">
                <h4>{{ s.nombre }}</h4>
                <p>📍 {{ s.ubicacion }}</p>
                <span class="badge badge-warning">Pendiente</span>
              </div>
            </article>
          }
        </div>
      }

      <h3 class="section-title">✅ Canchas aprobadas</h3>
      <div class="courts-grid">
        @for (c of canchas(); track c.id) {
          <app-court-card [cancha]="c" [showEstado]="true" estado="APROBADA" actionLabel="" />
        } @empty {
          <div class="empty-state"><div class="empty-state-icon">🏟️</div><p>Aún no tienes canchas aprobadas</p></div>
        }
      </div>

      @if (rechazadas().length) {
        <h3 class="section-title" style="margin-top:32px">❌ Rechazadas</h3>
        <div class="courts-grid">
          @for (s of rechazadas(); track s.id) {
            <article class="pending-card rejected">
              <div class="pending-body">
                <h4>{{ s.nombre }}</h4>
                <span class="badge badge-danger">Rechazada</span>
              </div>
            </article>
          }
        </div>
      }
    }
  `,
  styles: [`
    .section-title { font-size: 1rem; margin-bottom: 16px; color: var(--color-text-muted); }
    .pending-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }
    .pending-card img { height: 140px; width: 100%; object-fit: cover; }
    .pending-body { padding: 16px; }
    .pending-body h4 { margin-bottom: 6px; }
    .pending-body p { font-size: 0.8125rem; color: var(--color-text-muted); margin-bottom: 10px; }
    .pending-card.rejected { padding: 16px; }
  `]
})
export class DuenoMisCanchasComponent implements OnInit {
  canchas = signal<CanchaEnriquecida[]>([]);
  pendientes = signal<SolicitudCancha[]>([]);
  rechazadas = signal<SolicitudCancha[]>([]);
  loading = signal(true);

  constructor(
    private api: ApiService,
    private meta: CanchaMetadataService,
    private kc: KeycloakService
  ) {}

  ngOnInit(): void {
    const user = this.kc.getUsername() ?? '';
    this.api.getCanchas().subscribe({
      next: data => {
        this.canchas.set(this.meta.getCanchasByOwner(user, data));
        this.pendientes.set(this.meta.getSolicitudesByOwner(user).filter(s => s.estado === 'PENDIENTE'));
        this.rechazadas.set(this.meta.getSolicitudesByOwner(user).filter(s => s.estado === 'RECHAZADA'));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
