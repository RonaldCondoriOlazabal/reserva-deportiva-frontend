import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, catchError } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CanchaMetadataService } from '../../core/cancha-metadata.service';
import { KeycloakService } from '../../core/keycloak.service';
import { ReservaPagoService } from '../../core/reserva-pago.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmModalComponent } from '../../shared/ui/ui.components';
import { CanchaEnriquecida, Horario, Reserva, Pago } from '../../core/models/cancha.model';

@Component({
  selector: 'app-dueno-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Dueño / <span>Horarios</span></nav>
      <h1 class="page-title">Gestionar horarios</h1>
      <p class="page-subtitle">Configura disponibilidad y horarios de tus canchas aprobadas</p>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div></div>
    } @else if (!canchas().length) {
      <div class="empty-state card tinted-card">
        <div class="empty-state-icon">📅</div>
        <p>No tienes canchas aprobadas. Registra una cancha y espera la aprobación del administrador.</p>
      </div>
    } @else {
      <div class="form-group card tinted-card card-body" style="margin-bottom:24px">
        <label class="form-label">Seleccionar cancha</label>
        <select class="form-control" [(ngModel)]="canchaSeleccionadaId" (ngModelChange)="onCanchaChange()">
          @for (c of canchas(); track c.id) {
            <option [value]="c.id">{{ c.nombre }} — {{ deporteLabel(c.tipo) }}</option>
          }
        </select>
        @if (canchaActual()) {
          <p class="cancha-info">Deporte: <strong>{{ deporteLabel(canchaActual()!.tipo) }}</strong></p>
        }
      </div>

      @if (horariosError()) {
        <div class="alert-warning card" style="margin-bottom:16px;padding:14px 18px;background:#FEF3C7;border:1px solid #F59E0B;border-radius:var(--radius-md)">
          ⚠️ El servicio de horarios no está disponible. Verifique que <strong>horarios-ms</strong> esté levantado y registrado en Eureka.
        </div>
      }

      <div class="card tinted-card">
        <div class="card-body">
          <h3 style="margin-bottom:16px">Nuevo horario</h3>
          <div class="horario-form">
            <input class="form-control" type="date" [(ngModel)]="nuevo.fecha" />
            <input class="form-control" [(ngModel)]="nuevo.horaInicio" placeholder="08:00" />
            <input class="form-control" [(ngModel)]="nuevo.horaFin" placeholder="09:00" />
            <button class="btn btn-primary" (click)="agregarHorario()">Agregar</button>
          </div>
        </div>
      </div>

      <div class="table-wrap card tinted-card" style="margin-top:20px">
        <table class="data-table">
          <thead>
            <tr><th>Deporte</th><th>Fecha</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            @for (h of horariosCancha(); track h.id) {
              <tr>
                <td>{{ canchaActual() ? deporteLabel(canchaActual()!.tipo) : '—' }}</td>
                <td>{{ h.fecha }}</td>
                <td>{{ h.horaInicio }}</td>
                <td>{{ h.horaFin }}</td>
                <td>
                  <span class="badge" [class]="estaOcupado(h) ? 'badge-danger' : 'badge-success'">
                    {{ estaOcupado(h) ? 'Ocupado' : 'Disponible' }}
                  </span>
                </td>
                <td>
                  @if (!estaOcupado(h)) {
                    <button class="btn btn-danger btn-sm" (click)="confirmDelete(h)">Eliminar</button>
                  } @else {
                    <span class="muted-text">Reservado</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6"><div class="empty-state"><p>Sin horarios. Agrega el primero arriba.</p></div></td></tr>
            }
          </tbody>
        </table>
      </div>
    }

    <app-confirm-modal
      [open]="!!deleteTarget()"
      title="Eliminar horario"
      message="¿Eliminar este horario?"
      confirmLabel="Eliminar"
      [danger]="true"
      (confirm)="eliminarHorario()"
      (cancel)="deleteTarget.set(null)"
    />
  `,
  styles: [`
    .tinted-card { background: linear-gradient(180deg, #F4F8FA 0%, #E8F0EB 100%); }
    .cancha-info { margin-top: 10px; font-size: 0.875rem; color: var(--color-text-muted); }
    .cancha-info strong { color: var(--color-primary); }
    .horario-form { display: grid; grid-template-columns: 1fr 100px 100px auto; gap: 10px; }
    .muted-text { font-size: 0.8125rem; color: var(--color-text-muted); }
    @media (max-width: 700px) { .horario-form { grid-template-columns: 1fr; } }
  `]
})
export class DuenoHorariosComponent implements OnInit {
  loading = signal(true);
  canchas = signal<CanchaEnriquecida[]>([]);
  horarios = signal<Horario[]>([]);
  reservas = signal<Reserva[]>([]);
  horariosError = signal(false);
  private pagosVisibles: Pago[] = [];
  canchaSeleccionadaId = 0;
  deleteTarget = signal<Horario | null>(null);
  nuevo = { fecha: '', horaInicio: '08:00', horaFin: '09:00' };

  constructor(
    private api: ApiService,
    private meta: CanchaMetadataService,
    private kc: KeycloakService,
    private rp: ReservaPagoService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.kc.getUsername() ?? '';
    forkJoin({
      canchas: this.api.getCanchas().pipe(catchError(() => of([]))),
      horarios: this.api.getHorarios().pipe(catchError(() => { this.horariosError.set(true); return of([]); })),
      reservas: this.api.getReservas().pipe(catchError(() => of([]))),
      pagos: this.api.getPagos().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ canchas, horarios, reservas, pagos }) => {
        const mis = this.meta.getCanchasByOwner(user, canchas);
        this.canchas.set(mis);
        if (mis.length) this.canchaSeleccionadaId = mis[0].id;
        this.horarios.set(horarios);
        this.reservas.set(reservas);
        this.pagosVisibles = this.rp.filtrarPagosVisibles(pagos);
        this.loading.set(false);
        if (this.horariosError()) {
          this.toast.warning('No se pudo conectar con el servicio de horarios. Verifique que horarios-ms esté activo.');
        }
      },
      error: () => this.loading.set(false)
    });
  }

  canchaActual = () => this.canchas().find(c => c.id === Number(this.canchaSeleccionadaId));

  horariosCancha = () => this.horarios().filter(h => h.idCancha === Number(this.canchaSeleccionadaId));

  deporteLabel(tipo: string): string {
    return tipo?.toLowerCase().includes('vole') ? '🏐 Vóley' : '⚽ Fútbol';
  }

  estaOcupado(h: Horario): boolean {
    if (!h.disponible) return true;
    return this.reservas().some(r =>
      r.idHorario === h.id && r.estado !== 'CANCELADA' &&
      (r.estado === 'CONFIRMADA' || this.rp.estaReservado(r, this.pagosVisibles))
    );
  }

  onCanchaChange(): void {
    this.nuevo.fecha = '';
  }

  agregarHorario(): void {
    if (!this.nuevo.fecha || !this.nuevo.horaInicio || !this.nuevo.horaFin) {
      this.toast.warning('Complete fecha y horario');
      return;
    }
    this.api.createHorario({
      idCancha: Number(this.canchaSeleccionadaId),
      fecha: this.nuevo.fecha,
      horaInicio: this.nuevo.horaInicio,
      horaFin: this.nuevo.horaFin,
      disponible: true
    }).subscribe({
      next: (h) => {
        this.horarios.update(list => [...list, h]);
        this.toast.success('Horario agregado');
        this.nuevo = { fecha: '', horaInicio: '08:00', horaFin: '09:00' };
      },
      error: () => this.toast.error('No se pudo agregar el horario')
    });
  }

  confirmDelete(h: Horario): void {
    this.deleteTarget.set(h);
  }

  eliminarHorario(): void {
    const h = this.deleteTarget();
    if (!h) return;
    this.api.deleteHorario(h.id).subscribe({
      next: () => {
        this.horarios.update(list => list.filter(x => x.id !== h.id));
        this.deleteTarget.set(null);
        this.toast.success('Horario eliminado');
      },
      error: () => this.toast.error('No se pudo eliminar')
    });
  }
}
