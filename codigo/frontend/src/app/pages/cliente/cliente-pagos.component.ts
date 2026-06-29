import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { KeycloakService } from '../../core/keycloak.service';
import { UserProfileService } from '../../core/user-profile.service';
import { ReservaPagoService } from '../../core/reserva-pago.service';
import { Pago, Reserva } from '../../core/models/cancha.model';

interface PagoFila {
  pago: Pago;
  reserva?: Reserva;
  estadoReserva: string;
}

@Component({
  selector: 'app-cliente-pagos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Cliente / <span>Historial de Pagos</span></nav>
      <h1 class="page-title">Historial de Pagos</h1>
      <p class="page-subtitle">Solo pagos completados</p>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div></div>
    } @else {
      <div class="table-wrap card tinted-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Monto</th><th>Método</th><th>Estado reserva</th><th>Fecha</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (f of filas(); track f.pago.id) {
              <tr>
                <td><strong>#{{ f.pago.id }}</strong></td>
                <td><strong>S/ {{ f.pago.monto }}</strong></td>
                <td>{{ rp.metodoLabel(f.pago.metodoPago) }}</td>
                <td>
                  <span class="badge" [class]="rp.estadoReservaBadge(f.reserva?.estado ?? '', [f.pago], f.pago.idReserva)">
                    {{ f.estadoReserva }}
                  </span>
                </td>
                <td>{{ f.pago.fechaPago }}</td>
                <td>
                  <a [routerLink]="['/cliente/comprobante', f.pago.id]" [state]="{ pago: f.pago }" class="btn btn-ghost btn-sm">Ver comprobante</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6"><div class="empty-state"><p>No hay pagos registrados</p></div></td></tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .tinted-card { background: linear-gradient(180deg, #F4F8FA 0%, #E8F0EB 100%); }
  `]
})
export class ClientePagosComponent implements OnInit {
  filas = signal<PagoFila[]>([]);
  loading = signal(true);

  constructor(
    private api: ApiService,
    private kc: KeycloakService,
    private profile: UserProfileService,
    public rp: ReservaPagoService
  ) {}

  ngOnInit(): void {
    const userId = this.profile.getUserId(this.kc.getUsername() ?? '');
    forkJoin({
      reservas: this.api.getReservas(),
      pagos: this.api.getPagos()
    }).subscribe({
      next: ({ reservas, pagos }) => {
        const misReservas = reservas.filter(r => r.idUsuario === userId);
        const reservaIds = new Set(misReservas.map(r => r.id));
        const reservaMap = new Map(misReservas.map(r => [r.id, r]));
        const visibles = this.rp.filtrarPagosVisibles(pagos)
          .filter(p => reservaIds.has(p.idReserva) && p.estado === 'APROBADO');

        this.filas.set(visibles.map(pago => {
          const reserva = reservaMap.get(pago.idReserva);
          return {
            pago,
            reserva,
            estadoReserva: this.rp.estadoReservaLabel(reserva?.estado ?? 'PENDIENTE', [pago], pago.idReserva)
          };
        }));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
