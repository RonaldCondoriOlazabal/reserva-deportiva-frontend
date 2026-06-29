import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CanchaEnriquecida } from '../../core/models/cancha.model';

@Component({
  selector: 'app-court-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="court-card animate-in">
      <div class="court-image">
        <img [src]="cancha.metadata.imagenUrl" [alt]="cancha.nombre" loading="lazy" />
        <span class="court-type">{{ tipoLabel }}</span>
        @if (showEstado && estado) {
          <span class="court-estado" [class]="estado.toLowerCase()">{{ estadoLabel }}</span>
        }
      </div>
      <div class="court-body">
        <h3 class="court-name">{{ cancha.nombre }}</h3>
        <p class="court-location">📍 {{ cancha.ubicacion }}</p>
        <div class="court-footer">
          <span class="court-price">S/ {{ cancha.metadata.precioHora }}<small>/hora</small></span>
          @if (link) {
            <a [routerLink]="link" class="btn btn-primary btn-sm">{{ actionLabel }}</a>
          } @else if (actionLabel) {
            <button class="btn btn-primary btn-sm" (click)="action.emit(cancha)">{{ actionLabel }}</button>
          }
        </div>
      </div>
    </article>
  `,
  styles: [`
    .court-card {
      background: var(--color-bg-card);
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      transition: transform var(--transition), box-shadow var(--transition);
    }
    .court-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    .court-image {
      position: relative;
      height: 180px;
      overflow: hidden;
    }
    .court-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .court-card:hover .court-image img { transform: scale(1.05); }
    .court-type {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(15, 23, 42, 0.75);
      color: white;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      backdrop-filter: blur(4px);
    }
    .court-estado {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .court-estado.pendiente { background: #FEF3C7; color: #92400E; }
    .court-estado.aprobada { background: #D1FAE5; color: #065F46; }
    .court-estado.rechazada { background: #FEE2E2; color: #991B1B; }
    .court-body { padding: 20px; }
    .court-name {
      font-size: 1.0625rem;
      font-weight: 700;
      margin-bottom: 6px;
      color: var(--color-primary);
    }
    .court-location {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      margin-bottom: 16px;
    }
    .court-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .court-price {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--color-accent);
    }
    .court-price small {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-text-muted);
    }
  `]
})
export class CourtCardComponent {
  @Input({ required: true }) cancha!: CanchaEnriquecida;
  @Input() link: string | null = null;
  @Input() actionLabel = 'Ver detalles';
  @Input() showEstado = false;
  @Input() estado = '';
  @Output() action = new EventEmitter<CanchaEnriquecida>();

  get tipoLabel(): string {
    const t = this.cancha.tipo?.toLowerCase() ?? '';
    if (t.includes('vole')) return '🏐 Vóley';
    if (t.includes('fut')) return '⚽ Fútbol';
    return this.cancha.tipo;
  }

  get estadoLabel(): string {
    const map: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      APROBADA: 'Aprobada',
      RECHAZADA: 'Rechazada'
    };
    return map[this.estado] ?? this.estado;
  }
}
