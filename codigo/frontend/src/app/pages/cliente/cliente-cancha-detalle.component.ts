import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, catchError, of, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CanchaMetadataService } from '../../core/cancha-metadata.service';
import { KeycloakService } from '../../core/keycloak.service';
import { UserProfileService } from '../../core/user-profile.service';
import { ReservaPagoService } from '../../core/reserva-pago.service';
import { ToastService } from '../../core/toast.service';
import { CanchaEnriquecida, Horario, Reserva } from '../../core/models/cancha.model';

type MetodoPago = 'yape' | 'tarjeta' | 'plin';

@Component({
  selector: 'app-cliente-cancha-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div><p>Cargando cancha...</p></div>
    } @else if (cancha()) {
      <div class="detalle-page animate-in">
        <nav class="breadcrumb">
          <a [routerLink]="backLink">Canchas</a> / <span>{{ cancha()!.nombre }}</span>
        </nav>

        <div class="detalle-layout">
          <div class="detalle-main">
            <div class="hero-image">
              <img [src]="cancha()!.metadata.imagenUrl" [alt]="cancha()!.nombre" />
              <span class="tipo-badge">{{ tipoLabel }}</span>
            </div>

            <div class="info-card card">
              <div class="card-body">
                <h1>{{ cancha()!.nombre }}</h1>
                <p class="desc">{{ cancha()!.metadata.descripcion }}</p>
                <div class="info-grid">
                  <div class="info-item"><span>📍 Ubicación</span><strong>{{ cancha()!.ubicacion }}</strong></div>
                  <div class="info-item"><span>🏟️ Deporte</span><strong>{{ tipoLabel }}</strong></div>
                  <div class="info-item"><span>💰 Precio/hora</span><strong class="price">S/ {{ cancha()!.metadata.precioHora }}</strong></div>
                  <div class="info-item"><span>📞 Teléfono</span><strong>{{ cancha()!.metadata.telefono }}</strong></div>
                </div>
              </div>
            </div>

            <div class="horarios-card card">
              <div class="card-body">
                <h3>{{ soloVista ? 'Horarios de la cancha' : 'Selecciona fecha y horario' }}</h3>
                <input class="form-control date-input" type="date" [(ngModel)]="fechaSeleccionada" (ngModelChange)="onFechaChange()" />

                <div class="calendar-legend">
                  <span><i class="dot available"></i> Disponible</span>
                  <span><i class="dot occupied"></i> Ocupado / Reservado</span>
                  @if (!soloVista) {
                    <span><i class="dot selected"></i> Seleccionado</span>
                  }
                </div>

                <div class="slots-grid">
                  @for (h of horariosDelDia(); track h.id) {
                    @if (soloVista) {
                      <div class="slot-readonly" [class.occupied]="!estaDisponible(h)">
                        {{ h.horaInicio }} - {{ h.horaFin }}
                        <small>{{ estaDisponible(h) ? 'Disponible' : 'Ocupado' }}</small>
                      </div>
                    } @else {
                      <button
                        type="button"
                        class="slot"
                        [class.available]="estaDisponible(h)"
                        [class.occupied]="!estaDisponible(h)"
                        [class.selected]="horarioSeleccionado()?.id === h.id"
                        [disabled]="!estaDisponible(h)"
                        (click)="seleccionarHorario(h)"
                      >
                        {{ h.horaInicio }} - {{ h.horaFin }}
                        <small>{{ estaDisponible(h) ? 'Disponible' : 'Ocupado' }}</small>
                      </button>
                    }
                  } @empty {
                    <p class="no-slots">No hay horarios para esta fecha.</p>
                  }
                </div>
              </div>
            </div>
          </div>

          @if (!soloVista) {
          <aside class="booking-panel card">
            <div class="card-body">
              <h3>Reservar cancha</h3>
              <div class="booking-summary">
                <p><strong>{{ cancha()!.nombre }}</strong></p>
                <p class="muted">{{ fechaSeleccionada || 'Selecciona fecha' }}</p>
                @if (horarioSeleccionado()) {
                  <p class="muted">{{ horarioSeleccionado()!.horaInicio }} - {{ horarioSeleccionado()!.horaFin }}</p>
                  <p class="status-line" [class.ok]="horarioDisponible()">
                    {{ horarioDisponible() ? '✓ Horario disponible' : '✗ Horario no disponible' }}
                  </p>
                }
                <div class="total">
                  <span>Total</span>
                  <strong>S/ {{ cancha()!.metadata.precioHora }}</strong>
                </div>
              </div>

              @if (!mostrarPago()) {
                <p class="separar-label">¿Desea separar esta cancha?</p>
                <button
                  class="btn btn-primary btn-block btn-lg"
                  [disabled]="!horarioSeleccionado() || !horarioDisponible()"
                  (click)="mostrarPago.set(true)"
                >
                  Sí, separar cancha
                </button>
                <button class="btn btn-secondary btn-block" (click)="toast.info('Horario consultado sin reserva')">
                  No, solo consultar
                </button>
              } @else {
                <div class="pago-section">
                  <h4>Método de pago</h4>
                  <div class="metodos">
                    @for (m of metodosPago; track m.id) {
                      <button
                        type="button"
                        class="metodo-btn"
                        [class.active]="metodoPago() === m.id"
                        [style.--metodo-bg]="m.bg"
                        (click)="metodoPago.set(m.id)"
                      >
                        <img [src]="m.img" [alt]="m.label" />
                        <span>{{ m.label }}</span>
                      </button>
                    }
                  </div>

                  @if (metodoPago() === 'tarjeta') {
                    <div class="tarjeta-form">
                      <div class="form-group">
                        <label class="form-label">Número de tarjeta *</label>
                        <input class="form-control" [(ngModel)]="tarjetaNumero"
                          placeholder="4111 1111 1111 1111" maxlength="19"
                          (input)="formatearTarjeta($event)" />
                      </div>
                      <div class="form-group">
                        <label class="form-label">Nombre en la tarjeta *</label>
                        <input class="form-control" [(ngModel)]="tarjetaNombre"
                          placeholder="JUAN PEREZ" style="text-transform:uppercase" />
                      </div>
                      <div class="tarjeta-row">
                        <div class="form-group">
                          <label class="form-label">Vencimiento *</label>
                          <input class="form-control" [(ngModel)]="tarjetaVencimiento"
                            placeholder="MM/AA" maxlength="5"
                            (input)="formatearVencimiento($event)" />
                        </div>
                        <div class="form-group">
                          <label class="form-label">CVV *</label>
                          <input class="form-control" [(ngModel)]="tarjetaCvv"
                            placeholder="123" maxlength="4" type="password" />
                        </div>
                      </div>
                    </div>
                  }
                  @if (metodoPago() === 'yape' || metodoPago() === 'plin') {
                    <div class="form-group">
                      <label class="form-label">
                        Número {{ metodoPago() === 'yape' ? 'Yape' : 'Plin' }} del propietario
                      </label>
                      <input class="form-control telefono-readonly" [value]="telefonoPropietario()" readonly />
                      <p class="form-hint">Realiza el pago a este número y confirma.</p>
                    </div>
                  }

                  <button
                    class="btn btn-primary btn-block btn-lg"
                    [disabled]="!horarioSeleccionado() || reservando()"
                    (click)="confirmarReserva()"
                  >
                    @if (reservando()) { Procesando... } @else { Pagar S/ {{ cancha()!.metadata.precioHora }} }
                  </button>
                  <button type="button" class="btn btn-ghost btn-block" (click)="mostrarPago.set(false)">← Volver</button>
                </div>
              }

              <a [routerLink]="backLink" class="btn btn-ghost btn-block back-link">← Volver a canchas</a>
            </div>
          </aside>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .detalle-layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
    .hero-image { position: relative; border-radius: var(--radius-xl); overflow: hidden; height: 320px; margin-bottom: 24px; box-shadow: var(--shadow-md); }
    .hero-image img { width: 100%; height: 100%; object-fit: cover; }
    .tipo-badge { position: absolute; bottom: 16px; left: 16px; background: rgba(11, 31, 51, 0.85); color: white; padding: 8px 16px; border-radius: 999px; font-weight: 600; font-size: 0.875rem; }
    .info-card h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 12px; color: var(--color-primary); }
    .desc { color: var(--color-text-muted); margin-bottom: 20px; line-height: 1.6; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item span { display: block; font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 4px; }
    .info-item .price { color: var(--color-accent); font-size: 1.125rem; }
    .horarios-card h3 { margin-bottom: 16px; color: var(--color-primary); }
    .date-input { max-width: 220px; margin-bottom: 16px; }
    .calendar-legend { display: flex; gap: 16px; margin-bottom: 16px; font-size: 0.8125rem; color: var(--color-text-muted); flex-wrap: wrap; }
    .calendar-legend span { display: flex; align-items: center; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .dot.available { background: var(--color-accent); }
    .dot.occupied { background: #EF4444; }
    .dot.selected { background: #6366F1; }
    .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
    .slot { padding: 12px; border-radius: var(--radius-sm); border: 2px solid var(--color-border); background: #f4f8f5; cursor: pointer; font-size: 0.8125rem; font-weight: 600; transition: all var(--transition); text-align: center; }
    .slot small { display: block; font-size: 0.6875rem; margin-top: 4px; font-weight: 500; }
    .slot.available:hover { border-color: var(--color-accent); background: var(--color-accent-light); }
    .slot.occupied { background: #FEE2E2; color: #991B1B; border-color: #FECACA; cursor: not-allowed; opacity: 0.7; }
    .slot.selected { border-color: #6366F1; background: #EEF2FF; color: #4338CA; }
    .no-slots { color: var(--color-text-muted); font-size: 0.875rem; grid-column: 1 / -1; }
    .slot-readonly { padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); font-size: 0.8125rem; font-weight: 600; text-align: center; background: #f4f8f5; }
    .slot-readonly.occupied { background: #FEE2E2; color: #991B1B; border-color: #FECACA; }
    .slot-readonly:not(.occupied) { background: #D1FAE5; color: #065F46; border-color: #A7F3D0; }
    .slot-readonly small { display: block; font-size: 0.6875rem; margin-top: 4px; font-weight: 500; }
    .booking-panel { position: sticky; top: calc(var(--navbar-height) + 16px); }
    .booking-panel h3 { margin-bottom: 20px; color: var(--color-primary); }
    .booking-summary { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--color-border); }
    .booking-summary p { margin-bottom: 4px; }
    .muted { color: var(--color-text-muted); font-size: 0.875rem; }
    .status-line { font-size: 0.8125rem; font-weight: 600; margin-top: 8px; color: #991B1B; }
    .status-line.ok { color: #065F46; }
    .total { display: flex; justify-content: space-between; margin-top: 16px; font-size: 1.125rem; }
    .total strong { color: var(--color-accent); font-size: 1.375rem; }
    .separar-label { font-size: 0.875rem; font-weight: 600; margin-bottom: 12px; }
    .separar-label + .btn { margin-bottom: 10px; }
    .pago-section h4 { font-size: 0.9375rem; margin-bottom: 12px; color: var(--color-primary); }
    .metodos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
    .metodo-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 6px; border: 2px solid var(--color-border); border-radius: var(--radius-md); background: var(--metodo-bg, #eef2f6); cursor: pointer; transition: all var(--transition); font-weight: 600; font-size: 0.75rem; color: white; }
    .metodo-btn img { width: 100%; max-width: 72px; height: 32px; object-fit: contain; border-radius: 6px; }
    .metodo-btn.active { border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2); transform: translateY(-2px); }
    .back-link { margin-top: 12px; }
    .tarjeta-form { display: flex; flex-direction: column; gap: 0; }
    .tarjeta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .telefono-readonly { background: #f4f8f5; font-weight: 700; font-size: 1rem; letter-spacing: 1px; cursor: default; }
    .form-hint { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px; }
    @media (max-width: 900px) { .detalle-layout { grid-template-columns: 1fr; } .booking-panel { position: static; } .info-grid { grid-template-columns: 1fr; } .metodos { grid-template-columns: 1fr; } }
  `]
})
export class ClienteCanchaDetalleComponent implements OnInit {
  cancha = signal<CanchaEnriquecida | null>(null);
  horarios = signal<Horario[]>([]);
  reservas = signal<Reserva[]>([]);
  loading = signal(true);
  reservando = signal(false);
  mostrarPago = signal(false);
  metodoPago = signal<MetodoPago>('yape');
  fechaSeleccionada = '';
  horarioSeleccionado = signal<Horario | null>(null);
  // Tarjeta fields
  tarjetaNumero = '';
  tarjetaNombre = '';
  tarjetaVencimiento = '';
  tarjetaCvv = '';
  // Legacy (kept for compat)
  tarjeta = '';
  telefono = '';
  private canchaId = 0;
  soloVista = false;
  backLink = '/cliente/canchas';

  telefonoPropietario = () => this.cancha()?.metadata?.telefono ?? '';

  metodosPago = [
    { id: 'yape' as MetodoPago, label: 'Yape', img: '/assets/payments/yape.svg', bg: '#742284' },
    { id: 'tarjeta' as MetodoPago, label: 'Tarjeta', img: '/assets/payments/tarjeta.svg', bg: '#1E3A8A' },
    { id: 'plin' as MetodoPago, label: 'Plin', img: '/assets/payments/plin.svg', bg: '#00A651' }
  ];

  horariosDelDia = computed(() =>
    this.horarios().filter(h => h.idCancha === this.canchaId && h.fecha === this.fechaSeleccionada)
  );

  horarioDisponible = computed(() => {
    const h = this.horarioSeleccionado();
    return !!h && this.estaDisponible(h);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private meta: CanchaMetadataService,
    private kc: KeycloakService,
    private profile: UserProfileService,
    private rp: ReservaPagoService,
    public toast: ToastService
  ) {}

  ngOnInit(): void {
    this.soloVista = this.kc.hasRole('DUENO');
    this.backLink = this.soloVista ? '/dueno/canchas' : '/cliente/canchas';
    this.canchaId = Number(this.route.snapshot.paramMap.get('id'));
    this.fechaSeleccionada = new Date().toISOString().slice(0, 10);

    forkJoin({
      cancha: this.api.getCancha(this.canchaId),
      horarios: this.api.getHorarios(),
      reservas: this.api.getReservas()
    }).subscribe({
      next: ({ cancha, horarios, reservas }) => {
        this.cancha.set(this.meta.enrich(cancha));
        this.horarios.set(horarios.filter(h => h.idCancha === this.canchaId));
        this.reservas.set(reservas);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar la cancha');
        this.router.navigate(['/cliente/canchas']);
      }
    });
  }

  get tipoLabel(): string {
    const t = this.cancha()?.tipo?.toLowerCase() ?? '';
    return t.includes('vole') ? '🏐 Vóley' : '⚽ Fútbol';
  }

  estaDisponible(h: Horario): boolean {
    if (!h.disponible) return false;
    return !this.reservas().some(r =>
      r.idHorario === h.id && r.estado !== 'CANCELADA' &&
      (r.estado === 'CONFIRMADA' || r.estado === 'PENDIENTE')
    );
  }

  onFechaChange(): void {
    this.horarioSeleccionado.set(null);
    this.mostrarPago.set(false);
  }

  seleccionarHorario(h: Horario): void {
    this.horarioSeleccionado.set(h);
    this.mostrarPago.set(false);
  }

  formatearTarjeta(e: Event): void {
    const input = e.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').slice(0, 16);
    val = val.replace(/(.{4})/g, '$1 ').trim();
    this.tarjetaNumero = val;
    input.value = val;
  }

  formatearVencimiento(e: Event): void {
    const input = e.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
    this.tarjetaVencimiento = val;
    input.value = val;
  }

  private validarPago(): boolean {
    if (this.metodoPago() === 'tarjeta') {
      if (!this.tarjetaNumero || this.tarjetaNumero.replace(/\s/g, '').length < 16) {
        this.toast.warning('Ingrese un número de tarjeta válido (16 dígitos)');
        return false;
      }
      if (!this.tarjetaNombre.trim()) {
        this.toast.warning('Ingrese el nombre en la tarjeta');
        return false;
      }
      if (!this.tarjetaVencimiento || this.tarjetaVencimiento.length < 5) {
        this.toast.warning('Ingrese la fecha de vencimiento (MM/AA)');
        return false;
      }
      if (!this.tarjetaCvv || this.tarjetaCvv.length < 3) {
        this.toast.warning('Ingrese el CVV');
        return false;
      }
    }
    return true;
  }

  confirmarReserva(): void {
    const h = this.horarioSeleccionado();
    const c = this.cancha();
    if (!h || !c || !this.horarioDisponible()) return;
    if (!this.validarPago()) return;

    this.reservando.set(true);
    const username = this.kc.getUsername() ?? 'cliente1';

    // Obtener o crear usuario, con fallback a ID generado si falla
    this.profile.ensureUsuario(username, this.kc.getEmail(), 'CLIENTE').pipe(
      catchError(() => of(this.profile.getUserId(username))),
      switchMap(userId =>
        this.api.createReserva({
          idUsuario: userId,
          idCancha: c.id,
          idHorario: h.id,
          fechaReserva: this.fechaSeleccionada,
          estado: 'PENDIENTE'
        })
      )
    ).subscribe({
      next: (reserva) => {
        const referencia = this.metodoPago() === 'tarjeta'
          ? `TARJETA-${this.tarjetaNumero.slice(-4)}`
          : `${this.metodoPago().toUpperCase()}-${this.telefonoPropietario()}`;
        this.rp.completarPago(reserva, h, this.metodoPago(), c.metadata.precioHora, referencia).subscribe({
          next: ({ pago }) => {
            this.toast.success('¡Reserva confirmada y pago registrado!');
            this.router.navigate(['/cliente/comprobante', pago.id], {
              state: { pago, cancha: c.nombre, monto: c.metadata.precioHora }
            });
          },
          error: () => {
            this.toast.error('No se pudo completar el pago');
            this.reservando.set(false);
          }
        });
      },
      error: (err) => {
        const status = err?.status;
        if (status === 401 || status === 403) {
          this.toast.error('Sesión expirada. Por favor, vuelve a iniciar sesión.');
        } else {
          this.toast.error('No se pudo crear la reserva. Verifique la conexión.');
        }
        this.reservando.set(false);
      }
    });
  }
}
