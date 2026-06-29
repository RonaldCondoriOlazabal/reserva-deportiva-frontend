import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, catchError } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CanchaMetadataService } from '../../core/cancha-metadata.service';
import { KeycloakService } from '../../core/keycloak.service';
import { UserProfileService } from '../../core/user-profile.service';
import { ReservaPagoService } from '../../core/reserva-pago.service';
import { Pago, Reserva, Usuario } from '../../core/models/cancha.model';

@Component({
  selector: 'app-dueno-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Dueño / <span>Reservas</span></nav>
      <h1 class="page-title">Reservas de Mis Canchas</h1>
      <p class="page-subtitle">Reservas pagadas y pendientes en tus canchas</p>
    </div>

    <div class="filters-bar">
      <div class="search-box">
        <input [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="Buscar reservas..." />
      </div>
      <select class="filter-select" [ngModel]="filtroEstado()" (ngModelChange)="filtroEstado.set($event)">
        <option value="">Todos</option>
        <option value="Reservado">Reservado</option>
        <option value="Pendiente">Pendiente</option>
      </select>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div></div>
    } @else {
      <div class="table-wrap card tinted-card">
        <table class="data-table">
          <thead>
            <tr><th>ID</th><th>Cliente</th><th>Cancha</th><th>Fecha</th><th>Horario</th><th>Estado</th></tr>
          </thead>
          <tbody>
            @for (r of filtered(); track r.id) {
              <tr>
                <td>#{{ r.id }}</td>
                <td>{{ getClienteNombre(r.idUsuario) }}</td>
                <td>{{ getCanchaNombre(r.idCancha) }}</td>
                <td>{{ r.fechaReserva }}</td>
                <td>{{ getHorarioLabel(r.idHorario) }}</td>
                <td>
                  <span class="badge" [class]="estadoBadge(r)">{{ estadoLabel(r) }}</span>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6"><div class="empty-state"><p>No hay reservas en tus canchas</p></div></td></tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .tinted-card { background: linear-gradient(180deg, #F4F8FA 0%, #E8F0EB 100%); }
  `]
})
export class DuenoReservasComponent implements OnInit {
  reservas  = signal<Reserva[]>([]);
  pagos     = signal<Pago[]>([]);
  canchaMap = signal<Record<number, string>>({});
  horarioMap= signal<Record<number, string>>({});
  usuarioMap= signal<Record<number, string>>({});
  loading   = signal(true);
  search    = signal('');
  filtroEstado = signal('');

  filtered = computed(() => {
    let list = this.reservas();
    const estado = this.filtroEstado();
    if (estado) list = list.filter(r => this.estadoLabel(r) === estado);
    const q = this.search().toLowerCase();
    if (q) list = list.filter(r =>
      String(r.id).includes(q) ||
      this.getCanchaNombre(r.idCancha).toLowerCase().includes(q) ||
      this.getClienteNombre(r.idUsuario).toLowerCase().includes(q)
    );
    return list;
  });

  constructor(
    private api: ApiService,
    private meta: CanchaMetadataService,
    private kc: KeycloakService,
    private profile: UserProfileService,
    private rp: ReservaPagoService
  ) {}

  ngOnInit(): void {
    const user = this.kc.getUsername() ?? '';
    forkJoin({
      canchas:  this.api.getCanchas().pipe(catchError(() => of([]))),
      horarios: this.api.getHorarios().pipe(catchError(() => of([]))),
      reservas: this.api.getReservas().pipe(catchError(() => of([]))),
      pagos:    this.api.getPagos().pipe(catchError(() => of([]))),
      usuarios: this.api.getUsuarios().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ canchas, horarios, reservas, pagos, usuarios }) => {

        // Canchas del dueño
        const misCanchas = this.meta.getCanchasByOwner(user, canchas);
        const misIds = misCanchas.length > 0
          ? new Set(misCanchas.map(c => c.id))
          : new Set(canchas.map(c => c.id));

        // Mapa canchaId → nombre
        const cMap: Record<number, string> = {};
        canchas.forEach(c => { cMap[c.id] = c.nombre; });
        this.canchaMap.set(cMap);

        // Mapa horarioId → label
        const hMap: Record<number, string> = {};
        horarios.forEach((h: {id: number; fecha: string; horaInicio: string; horaFin: string}) => {
          hMap[h.id] = `${h.fecha} ${h.horaInicio}-${h.horaFin}`;
        });
        this.horarioMap.set(hMap);

        // Mapa usuarioId → username (del backend)
        const uMap: Record<number, string> = {};
        (usuarios as Usuario[]).forEach(u => { uMap[u.id] = u.username; });
        this.usuarioMap.set(uMap);

        this.pagos.set(this.rp.filtrarPagosVisibles(pagos));
        this.reservas.set(reservas.filter((r: Reserva) => misIds.has(r.idCancha)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getCanchaNombre(id: number): string {
    return this.canchaMap()[id] ?? `Cancha #${id}`;
  }

  getHorarioLabel(id: number): string {
    return this.horarioMap()[id] ?? `#${id}`;
  }

  getClienteNombre(idUsuario: number): string {
    const username = this.usuarioMap()[idUsuario];
    if (!username) return this.profile.getNameByUserId(idUsuario);
    // Usar displayName si fue personalizado, si no usar el username
    const displayName = this.profile.getDisplayName(username);
    return displayName;
  }

  estadoLabel(r: Reserva): string {
    return this.rp.estadoReservaLabel(r.estado, this.pagos(), r.id);
  }

  estadoBadge(r: Reserva): string {
    return this.rp.estadoReservaBadge(r.estado, this.pagos(), r.id);
  }
}
