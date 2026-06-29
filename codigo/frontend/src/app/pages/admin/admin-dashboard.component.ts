import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CanchaMetadataService } from '../../core/cancha-metadata.service';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, StatCardComponent],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Administrador / <span>Panel</span></nav>
      <h1 class="page-title">Panel de Administración</h1>
      <p class="page-subtitle">Gestión de solicitudes de registro de canchas</p>
    </div>

    <div class="stats-grid">
      <app-stat-card icon="📋" label="Solicitudes pendientes" [value]="pendientes()" color="#EF4444" />
      <app-stat-card icon="✅" label="Solicitudes aprobadas" [value]="aprobadas()" color="#10B981" />
      <app-stat-card icon="❌" label="Solicitudes rechazadas" [value]="rechazadas()" color="#64748B" />
    </div>

    <div class="card action-card">
      <div class="card-body">
        <h3>Acción principal</h3>
        <p>Revisa y aprueba las solicitudes de canchas enviadas por los dueños.</p>
        <a routerLink="/admin/solicitudes" class="btn btn-primary btn-lg">Ir a solicitudes</a>
      </div>
    </div>
  `,
  styles: [`
    .action-card h3 { margin-bottom: 8px; }
    .action-card p { color: var(--color-text-muted); margin-bottom: 20px; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  pendientes = signal(0);
  aprobadas = signal(0);
  rechazadas = signal(0);

  constructor(private meta: CanchaMetadataService) {}

  ngOnInit(): void {
    const all = this.meta.getSolicitudes();
    this.pendientes.set(all.filter(s => s.estado === 'PENDIENTE').length);
    this.aprobadas.set(all.filter(s => s.estado === 'APROBADA').length);
    this.rechazadas.set(all.filter(s => s.estado === 'RECHAZADA').length);
  }
}
