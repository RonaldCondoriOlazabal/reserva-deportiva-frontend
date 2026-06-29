import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { KeycloakService } from '../../core/keycloak.service';
import { UserProfileService } from '../../core/user-profile.service';
import { ReservaPagoService } from '../../core/reserva-pago.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmModalComponent } from '../../shared/ui/ui.components';
import { Pago, Reserva } from '../../core/models/cancha.model';

@Component({
  selector: 'app-cliente-mis-reservas',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModalComponent],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Cliente / <span>Mis Reservas</span></nav>
      <h1 class="page-title">Mis Reservas</h1>
      <p class="page-subtitle">Historial y reservas activas</p>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div></div>
    } @else {
      <div class="reservas-list">
        @for (r of reservas(); track r.id) {
          <div class="reserva-card card tinted-card animate-in">
            <div class="card-body">
              <div class="reserva-header">
                <div>
                  <h3>{{ getCanchaNombre(r.idCancha) }}</h3>
                  <p class="muted">Reserva #{{ r.id }} · {{ r.fechaReserva }}</p>
                </div>
                <span class="badge" [class]="estadoBadge(r)">{{ estadoLabel(r) }}</span>
              </div>
              <p class="horario-info">🕐 {{ getHorarioLabel(r.idHorario) }}</p>
              <div class="reserva-actions">
                @if (estadoLabel(r) === 'Pendiente') {
                  <a [routerLink]="['/cliente/pago', r.id]" class="btn btn-primary btn-sm">Pagar</a>
                  <button class="btn btn-danger btn-sm" (click)="confirmCancel(r)">Cancelar</button>
                }
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <div class="empty-state-icon">📅</div>
            <p>No tienes reservas aún</p>
            <a routerLink="/cliente/canchas" class="btn btn-primary" style="margin-top:16px">Explorar canchas</a>
          </div>
        }
      </div>
    }

    <app-confirm-modal
      [open]="!!cancelTarget()"
      title="Cancelar reserva"
      message="¿Está seguro de cancelar esta reserva?"
      confirmLabel="Cancelar reserva"
      [danger]="true"
      (confirm)="cancelar()"
      (cancel)="cancelTarget.set(null)"
    />
  `,
  styles: [`
    .reservas-list { display: flex; flex-direction: column; gap: 16px; }
    .tinted-card { background: linear-gradient(180deg, #F4F8FA 0%, #E8F0EB 100%); }
    .reserva-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .reserva-header h3 { font-size: 1.0625rem; color: var(--color-primary); }
    .muted { color: var(--color-text-muted); font-size: 0.8125rem; }
    .horario-info { font-size: 0.875rem; margin-bottom: 16px; }
    .reserva-actions { display: flex; gap: 8px; }
  `]
})
export class ClienteMisReservasComponent implements OnInit {
  reservas = signal<Reserva[]>([]);
  pagos = signal<Pago[]>([]);
  loading = signal(true);
  cancelTarget = signal<Reserva | null>(null);
  private canchaMap: Record<number, string> = {};
  private horarioMap: Record<number, string> = {};
  private userId = 0;

  constructor(
    private api: ApiService,
    private kc: KeycloakService,
    private profile: UserProfileService,
    private rp: ReservaPagoService,
    private toast: ToastService
  ) {
    this.userId = this.profile.getUserId(this.kc.getUsername() ?? '');
  }

  ngOnInit(): void {
    forkJoin({
      canchas: this.api.getCanchas(),
      horarios: this.api.getHorarios(),
      reservas: this.api.getReservas(),
      pagos: this.api.getPagos()
    }).subscribe({
      next: ({ canchas, horarios, reservas, pagos }) => {
        canchas.forEach(c => { this.canchaMap[c.id] = c.nombre; });
        horarios.forEach(h => { this.horarioMap[h.id] = `${h.fecha} ${h.horaInicio} - ${h.horaFin}`; });
        this.pagos.set(this.rp.filtrarPagosVisibles(pagos));
        this.reservas.set(reservas.filter(r => r.idUsuario === this.userId));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getCanchaNombre(id: number): string {
    return this.canchaMap[id] ?? `Cancha #${id}`;
  }

  getHorarioLabel(id: number): string {
    return this.horarioMap[id] ?? `Horario #${id}`;
  }

  estadoLabel(r: Reserva): string {
    return this.rp.estadoReservaLabel(r.estado, this.pagos(), r.id);
  }

  estadoBadge(r: Reserva): string {
    return this.rp.estadoReservaBadge(r.estado, this.pagos(), r.id);
  }

  confirmCancel(r: Reserva): void {
    this.cancelTarget.set(r);
  }

  cancelar(): void {
    const r = this.cancelTarget();
    if (!r) return;
    this.api.deleteReserva(r.id).subscribe({
      next: () => {
        this.toast.success('Reserva cancelada');
        this.reservas.update(list => list.filter(x => x.id !== r.id));
        this.cancelTarget.set(null);
      },
      error: () => this.toast.error('No se pudo cancelar la reserva')
    });
  }
}
