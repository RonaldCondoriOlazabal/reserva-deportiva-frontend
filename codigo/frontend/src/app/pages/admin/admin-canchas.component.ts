import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { CanchaMetadataService } from '../../core/cancha-metadata.service';
import { CanchaEnriquecida } from '../../core/models/cancha.model';
import { CourtCardComponent } from '../../shared/court-card/court-card.component';
import { ConfirmModalComponent } from '../../shared/ui/ui.components';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-admin-canchas',
  standalone: true,
  imports: [CommonModule, FormsModule, CourtCardComponent, ConfirmModalComponent],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Administrador / <span>Canchas aprobadas</span></nav>
      <h1 class="page-title">Canchas Aprobadas</h1>
      <p class="page-subtitle">Todas las canchas activas en el sistema</p>
    </div>

    <div class="filters-bar">
      <div class="search-box">
        <input [(ngModel)]="search" placeholder="Buscar canchas..." />
      </div>
      <select class="filter-select" [(ngModel)]="filtroTipo">
        <option value="">Todos los deportes</option>
        <option value="futbol">Fútbol</option>
        <option value="voley">Vóley</option>
      </select>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div></div>
    } @else {
      <div class="courts-grid">
        @for (c of filtered(); track c.id) {
          <div class="court-wrap">
            <app-court-card [cancha]="c" actionLabel="Eliminar" (action)="confirmDelete(c)" />
          </div>
        } @empty {
          <div class="empty-state"><div class="empty-state-icon">🏟️</div><p>No hay canchas aprobadas</p></div>
        }
      </div>
    }

    <app-confirm-modal
      [open]="!!deleteTarget()"
      title="Eliminar cancha"
      [message]="'¿Eliminar la cancha ' + (deleteTarget()?.nombre ?? '') + '? Esta acción no se puede deshacer.'"
      confirmLabel="Eliminar"
      [danger]="true"
      (confirm)="eliminar()"
      (cancel)="deleteTarget.set(null)"
    />
  `
})
export class AdminCanchasComponent implements OnInit {
  canchas = signal<CanchaEnriquecida[]>([]);
  loading = signal(true);
  search = '';
  filtroTipo = '';
  deleteTarget = signal<CanchaEnriquecida | null>(null);

  filtered = computed(() => {
    let list = this.canchas().filter(c => c.activa);
    if (this.filtroTipo) list = list.filter(c => c.tipo.toLowerCase().includes(this.filtroTipo));
    const q = this.search.toLowerCase();
    if (q) list = list.filter(c => c.nombre.toLowerCase().includes(q) || c.ubicacion.toLowerCase().includes(q));
    return list;
  });

  constructor(private api: ApiService, private meta: CanchaMetadataService, private toast: ToastService) {}

  ngOnInit(): void {
    this.api.getCanchas().subscribe({
      next: data => { this.canchas.set(this.meta.enrichAll(data)); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Error al cargar canchas'); }
    });
  }

  confirmDelete(c: CanchaEnriquecida): void {
    this.deleteTarget.set(c);
  }

  eliminar(): void {
    const c = this.deleteTarget();
    if (!c) return;
    this.api.deleteCancha(c.id).subscribe({
      next: () => {
        this.toast.success('Cancha eliminada');
        this.canchas.update(list => list.filter(x => x.id !== c.id));
        this.deleteTarget.set(null);
      },
      error: () => this.toast.error('No se pudo eliminar la cancha')
    });
  }
}
