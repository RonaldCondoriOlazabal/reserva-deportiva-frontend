import { Injectable } from '@angular/core';
import { Observable, switchMap, map } from 'rxjs';
import { ApiService } from './api.service';
import { Horario, Pago, Reserva } from './models/cancha.model';

@Injectable({ providedIn: 'root' })
export class ReservaPagoService {
  constructor(private api: ApiService) {}

  esPagoVisible(p: Pago): boolean {
    return p.metodoPago?.toUpperCase() !== 'KAFKA';
  }

  filtrarPagosVisibles(pagos: Pago[]): Pago[] {
    const visibles = pagos.filter(p => this.esPagoVisible(p));
    const porReserva = new Map<number, Pago>();
    for (const p of visibles) {
      const prev = porReserva.get(p.idReserva);
      if (!prev || p.id > prev.id) porReserva.set(p.idReserva, p);
    }
    return Array.from(porReserva.values()).sort((a, b) => b.id - a.id);
  }

  metodoLabel(metodo: string): string {
    const m = metodo?.toUpperCase() ?? '';
    return ({ YAPE: 'Yape', PLIN: 'Plin', TARJETA: 'Tarjeta', KAFKA: 'Automático' })[m] ?? metodo;
  }

  estadoReservaLabel(estado: string, pagos: Pago[], reservaId: number): string {
    if (estado === 'CANCELADA') return 'Cancelado';
    const pago = pagos.find(p => p.idReserva === reservaId && this.esPagoVisible(p));
    if (estado === 'CONFIRMADA' || pago?.estado === 'APROBADO') return 'Reservado';
    return 'Pendiente';
  }

  estadoReservaBadge(estado: string, pagos: Pago[], reservaId: number): string {
    const label = this.estadoReservaLabel(estado, pagos, reservaId);
    return { Reservado: 'badge-success', Pendiente: 'badge-warning', Cancelado: 'badge-danger' }[label] ?? 'badge-neutral';
  }

  estaReservado(r: Reserva, pagos: Pago[]): boolean {
    if (r.estado === 'CANCELADA') return false;
    if (r.estado === 'CONFIRMADA') return true;
    return pagos.some(p => p.idReserva === r.id && this.esPagoVisible(p) && p.estado === 'APROBADO');
  }

  completarPago(
    reserva: Reserva,
    horario: Horario,
    metodo: string,
    monto: number,
    referencia?: string
  ): Observable<{ pago: Pago; reserva: Reserva }> {
    const hoy = new Date().toISOString().slice(0, 10);
    return this.api.createPago({
      idReserva: reserva.id,
      monto,
      metodoPago: metodo.toUpperCase(),
      estado: 'APROBADO',
      fechaPago: hoy,
      referencia: referencia ?? `${metodo.toUpperCase()}-${Date.now()}`
    }).pipe(
      switchMap(pago =>
        this.api.updateReserva(reserva.id, {
          idUsuario: reserva.idUsuario,
          idCancha: reserva.idCancha,
          idHorario: reserva.idHorario,
          fechaReserva: reserva.fechaReserva,
          estado: 'CONFIRMADA'
        }).pipe(
          switchMap(updated =>
            this.api.updateHorario(horario.id, { ...horario, disponible: false }).pipe(
              map(() => ({ pago, reserva: updated }))
            )
          )
        )
      )
    );
  }
}
