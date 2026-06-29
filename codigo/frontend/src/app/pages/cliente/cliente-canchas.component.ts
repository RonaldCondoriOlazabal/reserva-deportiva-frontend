import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { CanchaMetadataService } from '../../core/cancha-metadata.service';
import { CourtCardComponent } from '../../shared/court-card/court-card.component';
import { CanchaEnriquecida } from '../../core/models/cancha.model';

@Component({
  selector: 'app-cliente-canchas',
  standalone: true,
  imports: [CommonModule, FormsModule, CourtCardComponent],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">{{ rolLabel }} / <span>Canchas</span></nav>
      <h1 class="page-title">Canchas disponibles</h1>
      <p class="page-subtitle">{{ rolLabel === 'Dueño' ? 'Explora otras canchas y sus horarios' : 'Encuentra la cancha perfecta para tu partido' }}</p>
    </div>

    <div class="filters-bar">
      <div class="search-box">
        <input [(ngModel)]="search" placeholder="Buscar por nombre o ubicación..." />
      </div>
      <select class="filter-select" [(ngModel)]="filtroTipo">
        <option value="">Todos los deportes</option>
        <option value="futbol">⚽ Fútbol</option>
        <option value="voley">🏐 Vóley</option>
      </select>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div></div>
    } @else {
      <div class="courts-grid">
        @for (c of paginated(); track c.id) {
          <app-court-card [cancha]="c" [link]="basePath + '/' + c.id" actionLabel="Ver detalles" />
        } @empty {
          <div class="empty-state"><div class="empty-state-icon">🏟️</div><p>No se encontraron canchas</p></div>
        }
      </div>

      @if (totalPages() > 1) {
        <div class="pagination">
          <button [disabled]="page() === 1" (click)="page.update(p => p - 1)">‹</button>
          @for (p of pages(); track p) {
            <button [class.active]="p === page()" (click)="page.set(p)">{{ p }}</button>
          }
          <button [disabled]="page() === totalPages()" (click)="page.update(p => p + 1)">›</button>
        </div>
      }
    }
  `
})
export class ClienteCanchasComponent implements OnInit {
  canchas = signal<CanchaEnriquecida[]>([]);
  loading = signal(true);
  search = '';
  filtroTipo = '';
  page = signal(1);
  pageSize = 9;
  isDueno = false;
  basePath = '/cliente/canchas';
  rolLabel = 'Cliente';

  filtered = computed(() => {
    let list = this.canchas();
    if (this.filtroTipo) list = list.filter(c => c.tipo.toLowerCase().includes(this.filtroTipo));
    const q = this.search.toLowerCase();
    if (q) list = list.filter(c => c.nombre.toLowerCase().includes(q) || c.ubicacion.toLowerCase().includes(q));
    return list;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  paginated = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  constructor(private api: ApiService, private meta: CanchaMetadataService, private router: Router) {
    this.isDueno = this.router.url.includes('/dueno/');
    this.basePath = this.isDueno ? '/dueno/canchas' : '/cliente/canchas';
    this.rolLabel = this.isDueno ? 'Dueño' : 'Cliente';
  }

  ngOnInit(): void {
    this.api.getCanchas().subscribe({
      next: data => {
        this.canchas.set(this.meta.enrichAll(data.filter(c => c.activa)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
