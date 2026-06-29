import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ReservaPagoService } from '../../core/reserva-pago.service';
import { ToastService } from '../../core/toast.service';
import { Horario, Reserva } from '../../core/models/cancha.model';

@Component({
  selector: 'app-cliente-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Cliente / <span>Pago</span></nav>
      <h1 class="page-title">Realizar Pago</h1>
      <p class="page-subtitle">Reserva #{{ reservaId }}</p>
    </div>

    <div class="pago-layout">
      <div class="card tinted-card pago-form">
        <div class="card-body">
          <h3>Método de pago</h3>
          <div class="metodos">
            @for (m of metodos; track m.id) {
              <button type="button" class="metodo-btn" [class.active]="metodo === m.id" [style.--metodo-bg]="m.bg" (click)="metodo = m.id">
                <img [src]="m.img" [alt]="m.label" />
                <span>{{ m.label }}</span>
              </button>
            }
          </div>

          @if (metodo === 'tarjeta') {
            <div class="form-group">
              <label class="form-label">Número de tarjeta</label>
              <input class="form-control" [(ngModel)]="tarjeta" placeholder="4111 1111 1111 1111" maxlength="19" />
            </div>
          }
          @if (metodo === 'yape' || metodo === 'plin') {
            <div class="form-group">
              <label class="form-label">Número de celular</label>
              <input class="form-control" [(ngModel)]="telefono" placeholder="999 000 000" />
            </div>
          }

          <button class="btn btn-primary btn-lg btn-block" [disabled]="procesando()" (click)="pagar()">
            @if (procesando()) { Procesando... } @else { Pagar S/ {{ monto }} }
          </button>
        </div>
      </div>

      <div class="card tinted-card pago-resumen">
        <div class="card-body">
          <h3>Resumen</h3>
          @if (canchaNombre) {
            <p><strong>{{ canchaNombre }}</strong></p>
          }
          <div class="resumen-row"><span>Reserva</span><span>#{{ reservaId }}</span></div>
          <div class="resumen-row total"><span>Total</span><strong>S/ {{ monto }}</strong></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pago-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; max-width: 800px; }
    .tinted-card { background: linear-gradient(180deg, #F4F8FA 0%, #E8F0EB 100%); }
    .metodos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
    .metodo-btn {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 12px 8px; border: 2px solid var(--color-border); border-radius: var(--radius-md);
      background: var(--metodo-bg, #eef2f6); cursor: pointer; transition: all var(--transition);
      font-weight: 600; font-size: 0.8125rem; color: white;
    }
    .metodo-btn img { width: 100%; max-width: 72px; height: 32px; object-fit: contain; border-radius: 6px; }
    .metodo-btn.active { border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2); }
    .resumen-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--color-border); font-size: 0.875rem; }
    .resumen-row.total { border: none; font-size: 1.125rem; margin-top: 8px; }
    .resumen-row.total strong { color: var(--color-accent); }
    @media (max-width: 600px) { .pago-layout { grid-template-columns: 1fr; } .metodos { grid-template-columns: 1fr; } }
  `]
})
export class ClientePagoComponent implements OnInit {
  reservaId = 0;
  monto = 50;
  canchaNombre = '';
  metodo = 'yape';
  tarjeta = '';
  telefono = '';
  procesando = signal(false);
  private reserva: Reserva | null = null;
  private horario: Horario | null = null;

  metodos = [
    { id: 'yape', label: 'Yape', img: '/assets/payments/yape.svg', bg: '#742284' },
    { id: 'tarjeta', label: 'Tarjeta', img: '/assets/payments/tarjeta.svg', bg: '#1E3A8A' },
    { id: 'plin', label: 'Plin', img: '/assets/payments/plin.svg', bg: '#00A651' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private rp: ReservaPagoService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.reservaId = Number(this.route.snapshot.paramMap.get('reservaId'));
    const state = history.state;
    if (state?.monto) this.monto = state.monto;
    if (state?.cancha) this.canchaNombre = state.cancha;

    forkJoin({
      reserva: this.api.getDetalleReserva(this.reservaId),
      horarios: this.api.getHorarios()
    }).subscribe({
      next: ({ reserva, horarios }) => {
        this.reserva = reserva;
        this.horario = horarios.find(h => h.id === reserva.idHorario) ?? null;
      }
    });
  }

  pagar(): void {
    if (!this.reserva || !this.horario) {
      this.toast.error('No se pudo cargar la reserva');
      return;
    }
    this.procesando.set(true);
    this.rp.completarPago(this.reserva, this.horario, this.metodo, this.monto).subscribe({
      next: ({ pago }) => {
        this.toast.success('Pago registrado — reserva confirmada');
        this.router.navigate(['/cliente/comprobante', pago.id], {
          state: { pago, cancha: this.canchaNombre, monto: this.monto }
        });
      },
      error: () => {
        this.toast.error('Error al procesar el pago');
        this.procesando.set(false);
      }
    });
  }
}
