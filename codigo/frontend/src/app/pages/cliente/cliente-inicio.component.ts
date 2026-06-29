import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { CanchaMetadataService } from '../../core/cancha-metadata.service';
import { CourtCardComponent } from '../../shared/court-card/court-card.component';
import { CanchaEnriquecida } from '../../core/models/cancha.model';

@Component({
  selector: 'app-cliente-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink, CourtCardComponent],
  template: `
    <div class="hero animate-in">
      <div class="hero-content">
        <h1>Reserva tu cancha favorita</h1>
        <p>Encuentra y reserva canchas de fútbol y vóley cerca de ti</p>
        <a routerLink="/cliente/canchas" class="btn btn-primary btn-lg">Explorar canchas</a>
      </div>
    </div>

    <h2 class="section-heading">Canchas destacadas</h2>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div></div>
    } @else {
      <div class="courts-grid">
        @for (c of destacadas(); track c.id) {
          <app-court-card [cancha]="c" [link]="'/cliente/canchas/' + c.id" actionLabel="Ver detalles" />
        }
      </div>
      <div style="text-align:center;margin-top:24px">
        <a routerLink="/cliente/canchas" class="btn btn-secondary">Ver todas las canchas →</a>
      </div>
    }
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, var(--color-primary) 0%, #1E3A5F 100%);
      border-radius: var(--radius-xl);
      padding: 48px 40px;
      color: white;
      margin-bottom: 36px;
    }
    .hero h1 { font-size: 2rem; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.02em; }
    .hero p { opacity: 0.85; margin-bottom: 24px; font-size: 1.0625rem; }
    .section-heading { font-size: 1.25rem; font-weight: 700; margin-bottom: 20px; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.4); }
    @media (max-width: 600px) { .hero { padding: 32px 24px; } .hero h1 { font-size: 1.5rem; } }
  `]
})
export class ClienteInicioComponent implements OnInit {
  canchas = signal<CanchaEnriquecida[]>([]);
  loading = signal(true);

  constructor(private api: ApiService, private meta: CanchaMetadataService) {}

  ngOnInit(): void {
    this.api.getCanchas().subscribe({
      next: data => {
        this.canchas.set(this.meta.enrichAll(data.filter(c => c.activa)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  destacadas = () => this.canchas().slice(0, 6);
}
