import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { KeycloakService } from '../../core/keycloak.service';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>📅 Nueva Reserva</h2>

    <div class="form-card">
      <div class="form-group">
        <label>Cancha</label>
        <select [(ngModel)]="form.idCancha" (change)="onCanchaChange()">
          <option value="">-- Selecciona cancha --</option>
          <option *ngFor="let c of canchas" [value]="c.id">{{ c.nombre }} - {{ c.ubicacion }}</option>
        </select>
      </div>

      <div class="form-group" *ngIf="horarios.length > 0">
        <label>Horario Disponible</label>
        <select [(ngModel)]="form.idHorario">
          <option value="">-- Selecciona horario --</option>
          <option *ngFor="let h of horarios" [value]="h.id">
            {{ h.fecha }} | {{ h.horaInicio }} - {{ h.horaFin }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Fecha de Reserva</label>
        <input type="date" [(ngModel)]="form.fechaReserva" />
      </div>

      <button class="btn-submit" (click)="crear()" [disabled]="loading">
        {{ loading ? 'Procesando...' : 'Confirmar Reserva' }}
      </button>
    </div>

    <h3 style="margin-top:40px">Mis Reservas</h3>
    <div *ngIf="reservas.length === 0" class="empty">No tienes reservas aun.</div>
    <table *ngIf="reservas.length > 0" class="tabla">
      <thead>
        <tr>
          <th>#</th>
          <th>Cancha</th>
          <th>Horario</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th>Accion</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of reservas">
          <td>{{ r.id }}</td>
          <td>{{ r.idCancha }}</td>
          <td>{{ r.idHorario }}</td>
          <td>{{ r.fechaReserva }}</td>
          <td><span class="badge" [class]="r.estado.toLowerCase()">{{ r.estado }}</span></td>
          <td>
            <button class="btn-pagar" (click)="irAPagar(r.id)">Pagar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div *ngIf="mensaje" class="mensaje" [class.error]="esError">{{ mensaje }}</div>
  `,
  styles: [`
    h2, h3 { color: #1a237e; }
    .form-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      padding: 28px;
      max-width: 500px;
    }
    .form-group { margin-bottom: 18px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; color: #333; }
    .form-group select, .form-group input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 0.95rem;
    }
    .btn-submit {
      width: 100%;
      padding: 12px;
      background: #1a237e;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
    }
    .btn-submit:disabled { background: #aaa; }
    .tabla { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .tabla th, .tabla td { padding: 10px 14px; border-bottom: 1px solid #eee; text-align: left; }
    .tabla th { background: #f5f5f5; font-weight: 600; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; }
    .badge.pendiente { background: #fff3e0; color: #e65100; }
    .badge.confirmada { background: #e8f5e9; color: #2e7d32; }
    .badge.cancelada { background: #fce4ec; color: #c62828; }
    .btn-pagar {
      padding: 6px 14px;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .mensaje { margin-top: 16px; padding: 12px; border-radius: 6px; background: #e8f5e9; color: #2e7d32; }
    .mensaje.error { background: #fce4ec; color: #c62828; }
    .empty { color: #999; margin-top: 12px; }
  `]
})
export class ReservasComponent implements OnInit {
  canchas: any[] = [];
  horarios: any[] = [];
  reservas: any[] = [];
  loading = false;
  mensaje = '';
  esError = false;

  form = {
    idCancha: '',
    idHorario: '',
    fechaReserva: '',
    idUsuario: 1,
    estado: 'PENDIENTE'
  };

  constructor(
    private api: ApiService,
    private kc: KeycloakService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.api.getCanchas().subscribe(data => this.canchas = data);
    this.cargarReservas();
  }

  onCanchaChange(): void {
    this.api.getHorarios().subscribe(data => {
      this.horarios = data.filter((h: any) => h.idCancha == this.form.idCancha && h.disponible);
    });
  }

  cargarReservas(): void {
    this.api.getReservas().subscribe({
      next: data => this.reservas = data,
      error: () => {}
    });
  }

  crear(): void {
    if (!this.form.idCancha || !this.form.idHorario || !this.form.fechaReserva) {
      this.mensaje = 'Completa todos los campos';
      this.esError = true;
      return;
    }
    this.loading = true;
    const body = {
      idUsuario: this.form.idUsuario,
      idCancha: Number(this.form.idCancha),
      idHorario: Number(this.form.idHorario),
      fechaReserva: this.form.fechaReserva,
      estado: 'PENDIENTE'
    };
    this.api.createReserva(body).subscribe({
      next: (r: any) => {
        this.loading = false;
        this.mensaje = `Reserva #${r.id} creada exitosamente`;
        this.esError = false;
        this.cargarReservas();
        this.router.navigate(['/pago', r.id]);
      },
      error: () => {
        this.loading = false;
        this.mensaje = 'Error al crear la reserva';
        this.esError = true;
      }
    });
  }

  irAPagar(reservaId: number): void {
    this.router.navigate(['/pago', reservaId]);
  }
}
