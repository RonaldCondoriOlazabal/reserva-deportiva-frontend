import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pago-container">
      <h2>💳 Metodo de Pago</h2>
      <p class="subtitulo">Reserva #{{ reservaId }}</p>

      <div class="monto-box">
        <span>Monto a pagar</span>
        <strong>S/ 50.00</strong>
      </div>

      <div class="metodos">
        <div
          class="metodo-card"
          [class.selected]="metodoPago === 'YAPE'"
          (click)="metodoPago = 'YAPE'">
          <span class="icono">📱</span>
          <span>Yape</span>
        </div>
        <div
          class="metodo-card"
          [class.selected]="metodoPago === 'TARJETA'"
          (click)="metodoPago = 'TARJETA'">
          <span class="icono">💳</span>
          <span>Tarjeta</span>
        </div>
        <div
          class="metodo-card"
          [class.selected]="metodoPago === 'PLIN'"
          (click)="metodoPago = 'PLIN'">
          <span class="icono">🟢</span>
          <span>Plin</span>
        </div>
      </div>

      <!-- Campos especificos por metodo -->
      <div class="campos-pago" *ngIf="metodoPago === 'YAPE' || metodoPago === 'PLIN'">
        <div class="form-group">
          <label>Numero de celular</label>
          <input type="tel" [(ngModel)]="celular" placeholder="9XXXXXXXX" maxlength="9" />
        </div>
      </div>

      <div class="campos-pago" *ngIf="metodoPago === 'TARJETA'">
        <div class="form-group">
          <label>Numero de tarjeta</label>
          <input type="text" [(ngModel)]="numeroTarjeta" placeholder="XXXX XXXX XXXX XXXX" maxlength="19" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Vencimiento</label>
            <input type="text" [(ngModel)]="vencimiento" placeholder="MM/AA" maxlength="5" />
          </div>
          <div class="form-group">
            <label>CVV</label>
            <input type="text" [(ngModel)]="cvv" placeholder="XXX" maxlength="3" />
          </div>
        </div>
      </div>

      <div *ngIf="mensaje" class="mensaje" [class.error]="esError">{{ mensaje }}</div>

      <div class="botones">
        <button class="btn-cancelar" (click)="cancelar()">Cancelar</button>
        <button class="btn-pagar" (click)="pagar()" [disabled]="!metodoPago || procesando">
          {{ procesando ? 'Procesando...' : 'Pagar Ahora' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pago-container {
      max-width: 480px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    h2 { color: #1a237e; margin-bottom: 4px; }
    .subtitulo { color: #999; margin-bottom: 24px; }
    .monto-box {
      background: #e8eaf6;
      border-radius: 8px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
    }
    .monto-box strong { font-size: 1.5rem; color: #1a237e; }
    .metodos {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .metodo-card {
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      padding: 16px 8px;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .metodo-card:hover { border-color: #1a237e; }
    .metodo-card.selected {
      border-color: #1a237e;
      background: #e8eaf6;
    }
    .icono { font-size: 2rem; }
    .campos-pago { margin-bottom: 20px; }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
    .form-group input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 0.95rem;
      box-sizing: border-box;
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .botones { display: flex; gap: 12px; margin-top: 24px; }
    .btn-cancelar {
      flex: 1;
      padding: 12px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-pagar {
      flex: 2;
      padding: 12px;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
    }
    .btn-pagar:disabled { background: #aaa; cursor: not-allowed; }
    .mensaje { padding: 12px; border-radius: 6px; margin-bottom: 16px; background: #e8f5e9; color: #2e7d32; }
    .mensaje.error { background: #fce4ec; color: #c62828; }
  `]
})
export class PagoComponent implements OnInit {
  reservaId!: number;
  metodoPago = '';
  celular = '';
  numeroTarjeta = '';
  vencimiento = '';
  cvv = '';
  procesando = false;
  mensaje = '';
  esError = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.reservaId = Number(this.route.snapshot.paramMap.get('reservaId'));
  }

  pagar(): void {
    this.procesando = true;
    const body = {
      idReserva: this.reservaId,
      monto: 50.00,
      metodoPago: this.metodoPago,
      estado: 'PENDIENTE',
      fechaPago: new Date().toISOString().split('T')[0],
      referencia: `${this.metodoPago}-${this.reservaId}-${Date.now()}`
    };
    this.api.createPago(body).subscribe({
      next: (pago: any) => {
        this.procesando = false;
        this.router.navigate(['/comprobante', pago.id], {
          state: { pago, reservaId: this.reservaId, metodoPago: this.metodoPago }
        });
      },
      error: () => {
        this.procesando = false;
        this.mensaje = 'Error al procesar el pago. Intenta nuevamente.';
        this.esError = true;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/reservas']);
  }
}
