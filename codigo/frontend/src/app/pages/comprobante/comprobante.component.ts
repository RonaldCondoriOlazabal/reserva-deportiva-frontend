import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-comprobante',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="comprobante-wrapper">
      <div class="comprobante" id="comprobante">
        <div class="header">
          <h1>🏟️ Reservas Deportivas UPEU</h1>
          <h2>COMPROBANTE DE PAGO</h2>
          <p class="folio">Folio: {{ pago?.referencia ?? pagoId }}</p>
        </div>

        <div class="estado-box" [class.aprobado]="estadoPago === 'APROBADO'" [class.pendiente]="estadoPago !== 'APROBADO'">
          <span *ngIf="estadoPago === 'APROBADO'">✅ PAGO APROBADO</span>
          <span *ngIf="estadoPago !== 'APROBADO'">⏳ PAGO EN PROCESO</span>
        </div>

        <table class="detalle">
          <tr>
            <td>Nro. Pago</td>
            <td><strong>#{{ pagoId }}</strong></td>
          </tr>
          <tr>
            <td>Reserva</td>
            <td><strong>#{{ reservaId }}</strong></td>
          </tr>
          <tr>
            <td>Metodo de Pago</td>
            <td><strong>{{ metodoPago }}</strong></td>
          </tr>
          <tr>
            <td>Fecha</td>
            <td><strong>{{ fecha }}</strong></td>
          </tr>
          <tr>
            <td>Monto</td>
            <td><strong class="monto">S/ 50.00</strong></td>
          </tr>
          <tr>
            <td>Estado</td>
            <td>
              <span class="badge" [class.aprobado]="estadoPago === 'APROBADO'">{{ estadoPago }}</span>
            </td>
          </tr>
        </table>

        <div class="footer">
          <p>Gracias por usar Reservas Deportivas UPEU</p>
          <p class="timestamp">Generado: {{ ahora }}</p>
        </div>
      </div>

      <div class="botones no-print">
        <button class="btn-imprimir" (click)="imprimir()">🖨️ Imprimir Comprobante</button>
        <a routerLink="/reservas" class="btn-volver">Volver a Reservas</a>
        <a routerLink="/canchas" class="btn-inicio">Ir al Inicio</a>
      </div>
    </div>
  `,
  styles: [`
    .comprobante-wrapper { max-width: 560px; margin: 0 auto; }
    .comprobante {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { font-size: 1.3rem; color: #1a237e; margin-bottom: 4px; }
    .header h2 { font-size: 1rem; color: #555; margin-bottom: 8px; letter-spacing: 2px; }
    .folio { color: #999; font-size: 0.85rem; }
    .estado-box {
      text-align: center;
      padding: 14px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 1.1rem;
      margin-bottom: 24px;
    }
    .estado-box.aprobado { background: #e8f5e9; color: #2e7d32; }
    .estado-box.pendiente { background: #fff3e0; color: #e65100; }
    .detalle { width: 100%; border-collapse: collapse; }
    .detalle tr { border-bottom: 1px solid #f0f0f0; }
    .detalle td { padding: 12px 8px; }
    .detalle td:first-child { color: #666; width: 40%; }
    .monto { font-size: 1.2rem; color: #1a237e; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; background: #fff3e0; color: #e65100; }
    .badge.aprobado { background: #e8f5e9; color: #2e7d32; }
    .footer { text-align: center; margin-top: 24px; color: #999; font-size: 0.85rem; }
    .timestamp { font-size: 0.75rem; }
    .botones {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      flex-wrap: wrap;
    }
    .btn-imprimir {
      flex: 2;
      padding: 12px;
      background: #1a237e;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
    }
    .btn-volver, .btn-inicio {
      flex: 1;
      padding: 12px;
      text-align: center;
      border: 1px solid #ccc;
      border-radius: 6px;
      text-decoration: none;
      color: #333;
      font-size: 0.9rem;
    }
    @media print {
      .no-print { display: none !important; }
      .comprobante { box-shadow: none; border: none; }
    }
  `]
})
export class ComprobanteComponent implements OnInit {
  pagoId!: number;
  reservaId: number = 0;
  metodoPago: string = '';
  estadoPago: string = 'PENDIENTE';
  fecha: string = '';
  ahora: string = '';
  pago: any = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.pagoId = Number(this.route.snapshot.paramMap.get('pagoId'));
    const state = history.state;
    if (state) {
      this.pago = state.pago;
      this.reservaId = state.reservaId ?? 0;
      this.metodoPago = state.metodoPago ?? state.pago?.metodoPago ?? '';
      this.estadoPago = state.pago?.estado ?? 'PENDIENTE';
      this.fecha = state.pago?.fechaPago ?? new Date().toISOString().split('T')[0];
    }
    this.ahora = new Date().toLocaleString('es-PE');
  }

  imprimir(): void {
    window.print();
  }
}
