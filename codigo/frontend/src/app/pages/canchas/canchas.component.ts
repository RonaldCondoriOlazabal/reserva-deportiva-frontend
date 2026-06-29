import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { KeycloakService } from '../../core/keycloak.service';

@Component({
  selector: 'app-canchas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>🏟️ Canchas Disponibles</h2>
    <div *ngIf="loading" class="loading">Cargando canchas...</div>
    <div class="grid" *ngIf="!loading">
      <div class="card" *ngFor="let cancha of canchas">
        <div class="card-header">
          <span class="tipo-badge">{{ cancha.tipo | uppercase }}</span>
          <span class="estado" [class.activa]="cancha.activa">
            {{ cancha.activa ? 'Disponible' : 'No disponible' }}
          </span>
        </div>
        <h3>{{ cancha.nombre }}</h3>
        <p>📍 {{ cancha.ubicacion }}</p>
        <button
          class="btn-reservar"
          [disabled]="!cancha.activa"
          (click)="reservar(cancha)">
          {{ isLoggedIn ? 'Reservar' : 'Inicia sesion para reservar' }}
        </button>
      </div>
    </div>
    <p *ngIf="!loading && canchas.length === 0">No hay canchas disponibles.</p>
  `,
  styles: [`
    h2 { margin-bottom: 24px; color: #1a237e; }
    .loading { text-align: center; padding: 40px; color: #666; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }
    .card {
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .tipo-badge {
      background: #1a237e;
      color: white;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
    }
    .estado { font-size: 0.85rem; color: #999; }
    .estado.activa { color: #4caf50; font-weight: bold; }
    .card h3 { margin: 0 0 8px; font-size: 1.1rem; }
    .card p { color: #666; margin-bottom: 16px; }
    .btn-reservar {
      width: 100%;
      padding: 10px;
      background: #1a237e;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
    }
    .btn-reservar:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  `]
})
export class CanchasComponent implements OnInit {
  canchas: any[] = [];
  loading = true;
  isLoggedIn: boolean;

  constructor(
    private api: ApiService,
    private kc: KeycloakService,
    private router: Router
  ) {
    this.isLoggedIn = kc.isLoggedIn();
  }

  ngOnInit(): void {
    this.api.getCanchas().subscribe({
      next: data => { this.canchas = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  reservar(cancha: any): void {
    if (!this.isLoggedIn) { this.kc.login(); return; }
    this.router.navigate(['/reservas'], { state: { canchaId: cancha.id, cancha } });
  }
}
