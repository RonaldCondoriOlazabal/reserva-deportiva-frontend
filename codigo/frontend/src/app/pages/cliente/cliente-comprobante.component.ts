import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ReservaPagoService } from '../../core/reserva-pago.service';
import { Pago } from '../../core/models/cancha.model';

@Component({
  selector: 'app-cliente-comprobante',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="comprobante-page animate-in">
      @if (loading()) {
        <div class="loading-overlay"><div class="spinner"></div></div>
      } @else if (pago()) {
        <div class="comprobante card" id="comprobante">
          <div class="comprobante-header">
            <div class="logo">🏟️</div>
            <div>
              <h1>Comprobante de Pago</h1>
              <p>Reserva Deportiva · Canchas Deportivas</p>
            </div>
          </div>

          <div class="comprobante-body">
            <div class="status-badge" [class]="pago()!.estado.toLowerCase()">{{ pago()!.estado }}</div>
            <div class="detail-grid">
              <div><span>N° Comprobante</span><strong>#{{ pago()!.id }}</strong></div>
              <div><span>Reserva</span><strong>#{{ pago()!.idReserva }}</strong></div>
              <div><span>Monto</span><strong class="amount">S/ {{ pago()!.monto }}</strong></div>
              <div><span>Método</span><strong>{{ rp.metodoLabel(pago()!.metodoPago) }}</strong></div>
              <div><span>Fecha</span><strong>{{ pago()!.fechaPago }}</strong></div>
              <div><span>Referencia</span><strong>{{ pago()!.referencia || 'N/A' }}</strong></div>
            </div>
            @if (canchaNombre) {
              <p class="cancha-ref">Cancha: <strong>{{ canchaNombre }}</strong></p>
            }
          </div>

          <div class="comprobante-footer">
            <p>Gracias por usar Reserva Deportiva</p>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-secondary" (click)="imprimir()">🖨️ Imprimir</button>
          <a routerLink="/cliente/mis-reservas" class="btn btn-primary">Ver mis reservas</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .comprobante-page { max-width: 520px; margin: 0 auto; }
    .comprobante { overflow: hidden; }
    .comprobante-header {
      background: var(--color-primary); color: white;
      padding: 28px; display: flex; align-items: center; gap: 16px;
    }
    .comprobante-header .logo { font-size: 2rem; }
    .comprobante-header h1 { font-size: 1.25rem; margin-bottom: 4px; }
    .comprobante-header p { opacity: 0.7; font-size: 0.8125rem; }
    .comprobante-body { padding: 28px; }
    .status-badge {
      display: inline-block; padding: 6px 14px; border-radius: 999px;
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 20px;
    }
    .status-badge.aprobado { background: #D1FAE5; color: #065F46; }
    .status-badge.pendiente { background: #FEF3C7; color: #92400E; }
    .status-badge.rechazado { background: #FEE2E2; color: #991B1B; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .detail-grid span { display: block; font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 2px; }
    .amount { color: var(--color-accent); font-size: 1.25rem; }
    .cancha-ref { margin-top: 20px; padding-top: 16px; border-top: 1px dashed var(--color-border); font-size: 0.875rem; }
    .comprobante-footer { padding: 16px 28px; background: var(--color-bg); text-align: center; font-size: 0.8125rem; color: var(--color-text-muted); }
    .actions { display: flex; gap: 12px; margin-top: 20px; justify-content: center; }
    @media print {
      .actions { display: none; }
      .comprobante { box-shadow: none; border: 1px solid #ccc; }
    }
  `]
})
export class ClienteComprobanteComponent implements OnInit {
  pago = signal<Pago | null>(null);
  loading = signal(true);
  canchaNombre = '';

  constructor(private route: ActivatedRoute, private api: ApiService, public rp: ReservaPagoService) {}

  ngOnInit(): void {
    const state = history.state;
    if (state?.pago) {
      this.pago.set(state.pago);
      this.canchaNombre = state.cancha ?? '';
      this.loading.set(false);
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('pagoId'));
    this.api.getPago(id).subscribe({
      next: p => { this.pago.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  imprimir(): void {
    window.print();
  }
}
