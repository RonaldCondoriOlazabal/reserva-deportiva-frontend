import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanchaMetadataService } from '../../core/cancha-metadata.service';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { SolicitudCancha } from '../../core/models/cancha.model';
import { ConfirmModalComponent } from '../../shared/ui/ui.components';

@Component({
  selector: 'app-admin-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Administrador / <span>Solicitudes</span></nav>
      <h1 class="page-title">Solicitudes de Canchas</h1>
      <p class="page-subtitle">Aprueba o rechaza las solicitudes de registro enviadas por los dueños</p>
    </div>

    <div class="filters-bar">
      <div class="search-box">
        <input [ngModel]="search()" (ngModelChange)="onSearchChange($event)" placeholder="Buscar por nombre, propietario o ubicación..." />
      </div>
      <select class="filter-select" [ngModel]="filtroEstado()" (ngModelChange)="onEstadoChange($event)">
        <option value="">Todos los estados</option>
        <option value="PENDIENTE">Pendiente</option>
        <option value="APROBADA">Aprobada</option>
        <option value="RECHAZADA">Rechazada</option>
      </select>
    </div>

    <div class="table-wrap card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Cancha</th>
            <th>Propietario</th>
            <th>Ubicación</th>
            <th>Deporte</th>
            <th>Precio/h</th>
            <th>Contacto</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (s of paginated(); track s.id) {
            <tr>
              <td><strong>{{ s.nombre }}</strong></td>
              <td>{{ s.ownerNombre || s.ownerUsername }}</td>
              <td>{{ s.ubicacion }}</td>
              <td>{{ s.tipo === 'futbol' ? '⚽ Fútbol' : '🏐 Vóley' }}</td>
              <td>S/ {{ s.precioHora }}</td>
              <td>{{ s.telefono }}</td>
              <td><span class="badge" [class]="badgeClass(s.estado)">{{ estadoLabel(s.estado) }}</span></td>
              <td class="actions">
                <button class="btn btn-ghost btn-sm" (click)="verDetalle(s)">Ver</button>
                @if (s.estado === 'PENDIENTE') {
                  <button class="btn btn-primary btn-sm" (click)="aprobar(s)" [disabled]="processing()">Aprobar</button>
                  <button class="btn btn-danger btn-sm" (click)="confirmReject(s)">Rechazar</button>
                }
                @if (s.estado === 'APROBADA') {
                  <button class="btn btn-warning btn-sm" (click)="confirmCambiarEstado(s, 'PENDIENTE')">↩ Pendiente</button>
                  <button class="btn btn-danger btn-sm" (click)="confirmCambiarEstado(s, 'RECHAZADA')">Rechazar</button>
                }
                @if (s.estado === 'RECHAZADA') {
                  <button class="btn btn-warning btn-sm" (click)="confirmCambiarEstado(s, 'PENDIENTE')">↩ Pendiente</button>
                  <button class="btn btn-primary btn-sm" (click)="aprobar(s)" [disabled]="processing()">Aprobar</button>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">📋</div><p>No hay solicitudes</p></div></td></tr>
          }
        </tbody>
      </table>
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

    @if (detalle()) {
      <div class="modal-backdrop" (click)="detalle.set(null)">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ detalle()!.nombre }}</h3>
            <button class="modal-close" (click)="detalle.set(null)">✕</button>
          </div>
          <div class="modal-body detalle-grid">
            <img [src]="detalle()!.imagenUrl" alt="" class="detalle-img" />
            <div>
              <p><strong>Propietario:</strong> {{ detalle()!.ownerNombre || detalle()!.ownerUsername }}</p>
              <p><strong>Ubicación:</strong> {{ detalle()!.ubicacion }}</p>
              <p><strong>N° Cancha:</strong> {{ detalle()!.numeroCancha }}</p>
              <p><strong>Precio:</strong> S/ {{ detalle()!.precioHora }}/hora</p>
              <p><strong>Teléfono:</strong> {{ detalle()!.telefono }}</p>
              <p><strong>Descripción:</strong> {{ detalle()!.descripcion }}</p>
              <p class="hint">Tras aprobar, el dueño configurará los horarios de su cancha.</p>
            </div>
          </div>
          @if (detalle()!.estado === 'PENDIENTE') {
            <div class="modal-footer">
              <button class="btn btn-danger" (click)="confirmReject(detalle()!)">Rechazar</button>
              <button class="btn btn-primary" (click)="aprobar(detalle()!)" [disabled]="processing()">Aprobar solicitud</button>
            </div>
          }
          @if (detalle()!.estado === 'APROBADA') {
            <div class="modal-footer">
              <button class="btn btn-warning" (click)="confirmCambiarEstado(detalle()!, 'PENDIENTE')">↩ Volver a Pendiente</button>
              <button class="btn btn-danger" (click)="confirmCambiarEstado(detalle()!, 'RECHAZADA')">Rechazar</button>
            </div>
          }
          @if (detalle()!.estado === 'RECHAZADA') {
            <div class="modal-footer">
              <button class="btn btn-warning" (click)="confirmCambiarEstado(detalle()!, 'PENDIENTE')">↩ Volver a Pendiente</button>
              <button class="btn btn-primary" (click)="aprobar(detalle()!)" [disabled]="processing()">Aprobar</button>
            </div>
          }
        </div>
      </div>
    }

    <app-confirm-modal
      [open]="!!rejectTarget()"
      title="Rechazar solicitud"
      message="¿Confirma que desea rechazar esta solicitud de cancha?"
      confirmLabel="Rechazar"
      [danger]="true"
      (confirm)="rechazar()"
      (cancel)="rejectTarget.set(null)"
    />

    <app-confirm-modal
      [open]="!!cambioEstadoTarget()"
      [title]="cambioEstadoNuevo() === 'PENDIENTE' ? 'Volver a pendiente' : 'Rechazar solicitud'"
      [message]="'¿Cambiar estado de &quot;' + (cambioEstadoTarget()?.nombre ?? '') + '&quot; a ' + estadoLabel(cambioEstadoNuevo()) + '?'"
      [confirmLabel]="cambioEstadoNuevo() === 'PENDIENTE' ? 'Sí, volver a pendiente' : 'Rechazar'"
      [danger]="cambioEstadoNuevo() === 'RECHAZADA'"
      (confirm)="ejecutarCambioEstado()"
      (cancel)="cambioEstadoTarget.set(null)"
    />
  `,
  styles: [`
    .actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .btn-warning { background: #F59E0B; color: white; border: none; }
    .btn-warning:hover { background: #D97706; }
    .modal-lg { max-width: 680px; }
    .detalle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .detalle-img { border-radius: var(--radius-md); height: 200px; object-fit: cover; width: 100%; }
    .detalle-grid p { margin-bottom: 8px; font-size: 0.875rem; }
    .hint { color: var(--color-text-muted); font-size: 0.8125rem; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--color-border); }
    @media (max-width: 600px) { .detalle-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminSolicitudesComponent implements OnInit {
  solicitudes = signal<SolicitudCancha[]>([]);
  search = signal('');
  filtroEstado = signal('');
  page = signal(1);
  pageSize = 8;
  detalle = signal<SolicitudCancha | null>(null);
  rejectTarget = signal<SolicitudCancha | null>(null);
  cambioEstadoTarget = signal<SolicitudCancha | null>(null);
  cambioEstadoNuevo = signal<'PENDIENTE' | 'RECHAZADA'>('PENDIENTE');
  processing = signal(false);

  filtered = computed(() => {
    let list = this.solicitudes();
    const estado = this.filtroEstado();
    if (estado) {
      list = list.filter(s => s.estado === estado);
    }
    const q = this.search().toLowerCase().trim();
    if (q) {
      list = list.filter(s =>
        s.nombre.toLowerCase().includes(q) ||
        s.ownerUsername.toLowerCase().includes(q) ||
        s.ubicacion.toLowerCase().includes(q)
      );
    }
    return list;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  paginated = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  constructor(
    private meta: CanchaMetadataService,
    private api: ApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.solicitudes.set(this.meta.getSolicitudes());
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onEstadoChange(value: string): void {
    this.filtroEstado.set(value);
    this.page.set(1);
  }

  estadoLabel(estado: string): string {
    return { PENDIENTE: 'Pendiente', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada' }[estado] ?? estado;
  }

  badgeClass(estado: string): string {
    return { PENDIENTE: 'badge-warning', APROBADA: 'badge-success', RECHAZADA: 'badge-danger' }[estado] ?? 'badge-neutral';
  }

  verDetalle(s: SolicitudCancha): void {
    this.detalle.set(s);
  }

  aprobar(s: SolicitudCancha): void {
    this.processing.set(true);
    this.api.createCancha({
      nombre: s.nombre,
      ubicacion: s.ubicacion,
      tipo: s.tipo,
      activa: true
    }).subscribe({
      next: (cancha) => {
        this.meta.saveMetadata({
          canchaId: cancha.id,
          ownerUsername: s.ownerUsername,
          numeroCancha: s.numeroCancha,
          precioHora: s.precioHora,
          telefono: s.telefono,
          descripcion: s.descripcion,
          imagenUrl: s.imagenUrl,
          estado: 'APROBADA'
        });
        this.meta.updateSolicitud(s.id, { estado: 'APROBADA', canchaId: cancha.id });
        this.toast.success(`Solicitud de "${s.nombre}" aprobada. El dueño puede configurar horarios.`);
        this.detalle.set(null);
        this.load();
        this.processing.set(false);
      },
      error: (err) => {
        const status = err?.status;
        if (status === 403) {
          this.toast.error('Sin permisos. Reinicie el Gateway y vuelva a iniciar sesión como administrador.');
        } else if (status === 0) {
          this.toast.error('No se pudo conectar con el servidor. Verifique que el Gateway esté activo.');
        } else {
          this.toast.error('No se pudo aprobar la solicitud.');
        }
        this.processing.set(false);
      }
    });
  }

  confirmCambiarEstado(s: SolicitudCancha, nuevoEstado: 'PENDIENTE' | 'RECHAZADA'): void {
    this.cambioEstadoTarget.set(s);
    this.cambioEstadoNuevo.set(nuevoEstado);
    this.detalle.set(null);
  }

  ejecutarCambioEstado(): void {
    const s = this.cambioEstadoTarget();
    const nuevo = this.cambioEstadoNuevo();
    if (!s) return;
    this.meta.updateSolicitud(s.id, { estado: nuevo });
    this.toast.info(`Solicitud "${s.nombre}" → ${this.estadoLabel(nuevo)}`);
    this.cambioEstadoTarget.set(null);
    this.load();
  }

  confirmReject(s: SolicitudCancha): void {
    this.rejectTarget.set(s);
    this.detalle.set(null);
  }

  rechazar(): void {
    const s = this.rejectTarget();
    if (!s) return;
    this.meta.updateSolicitud(s.id, { estado: 'RECHAZADA' });
    this.toast.info(`Solicitud "${s.nombre}" rechazada`);
    this.rejectTarget.set(null);
    this.load();
  }
}
