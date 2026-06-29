import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>⚙️ Panel de Administracion</h2>

    <div class="tabs">
      <button [class.active]="tab === 'canchas'" (click)="tab = 'canchas'">🏟️ Canchas</button>
      <button [class.active]="tab === 'horarios'" (click)="tab = 'horarios'">📅 Horarios</button>
      <button [class.active]="tab === 'reservas'" (click)="tab = 'reservas'">📋 Reservas</button>
      <button [class.active]="tab === 'pagos'" (click)="tab = 'pagos'">💳 Pagos</button>
    </div>

    <!-- CANCHAS -->
    <div *ngIf="tab === 'canchas'">
      <h3>Gestionar Canchas</h3>
      <div class="form-inline">
        <input [(ngModel)]="nuevaCancha.nombre" placeholder="Nombre" />
        <input [(ngModel)]="nuevaCancha.ubicacion" placeholder="Ubicacion" />
        <input [(ngModel)]="nuevaCancha.tipo" placeholder="Tipo (futbol, voley...)" />
        <button (click)="crearCancha()">+ Agregar</button>
      </div>
      <table class="tabla">
        <thead><tr><th>ID</th><th>Nombre</th><th>Ubicacion</th><th>Tipo</th><th>Activa</th><th>Accion</th></tr></thead>
        <tbody>
          <tr *ngFor="let c of canchas">
            <td>{{ c.id }}</td>
            <td>{{ c.nombre }}</td>
            <td>{{ c.ubicacion }}</td>
            <td>{{ c.tipo }}</td>
            <td>{{ c.activa ? 'Si' : 'No' }}</td>
            <td><button class="btn-delete" (click)="eliminarCancha(c.id)">Eliminar</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- HORARIOS -->
    <div *ngIf="tab === 'horarios'">
      <h3>Gestionar Horarios</h3>
      <div class="form-inline">
        <select [(ngModel)]="nuevoHorario.idCancha">
          <option value="">-- Cancha --</option>
          <option *ngFor="let c of canchas" [value]="c.id">{{ c.nombre }}</option>
        </select>
        <input [(ngModel)]="nuevoHorario.fecha" type="date" />
        <input [(ngModel)]="nuevoHorario.horaInicio" placeholder="08:00" />
        <input [(ngModel)]="nuevoHorario.horaFin" placeholder="09:00" />
        <button (click)="crearHorario()">+ Agregar</button>
      </div>
      <table class="tabla">
        <thead><tr><th>ID</th><th>Cancha</th><th>Fecha</th><th>Inicio</th><th>Fin</th><th>Disponible</th><th>Accion</th></tr></thead>
        <tbody>
          <tr *ngFor="let h of horarios">
            <td>{{ h.id }}</td>
            <td>{{ h.idCancha }}</td>
            <td>{{ h.fecha }}</td>
            <td>{{ h.horaInicio }}</td>
            <td>{{ h.horaFin }}</td>
            <td>{{ h.disponible ? 'Si' : 'No' }}</td>
            <td><button class="btn-delete" (click)="eliminarHorario(h.id)">Eliminar</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- RESERVAS -->
    <div *ngIf="tab === 'reservas'">
      <h3>Todas las Reservas</h3>
      <table class="tabla">
        <thead><tr><th>ID</th><th>Usuario</th><th>Cancha</th><th>Horario</th><th>Fecha</th><th>Estado</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of reservas">
            <td>{{ r.id }}</td>
            <td>{{ r.idUsuario }}</td>
            <td>{{ r.idCancha }}</td>
            <td>{{ r.idHorario }}</td>
            <td>{{ r.fechaReserva }}</td>
            <td><span class="badge" [class]="r.estado?.toLowerCase()">{{ r.estado }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGOS -->
    <div *ngIf="tab === 'pagos'">
      <h3>Todos los Pagos</h3>
      <table class="tabla">
        <thead><tr><th>ID</th><th>Reserva</th><th>Monto</th><th>Metodo</th><th>Estado</th><th>Fecha</th><th>Referencia</th></tr></thead>
        <tbody>
          <tr *ngFor="let p of pagos">
            <td>{{ p.id }}</td>
            <td>{{ p.idReserva }}</td>
            <td>S/ {{ p.monto }}</td>
            <td>{{ p.metodoPago }}</td>
            <td><span class="badge" [class]="p.estado?.toLowerCase()">{{ p.estado }}</span></td>
            <td>{{ p.fechaPago }}</td>
            <td>{{ p.referencia }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div *ngIf="mensaje" class="mensaje">{{ mensaje }}</div>
  `,
  styles: [`
    h2 { color: #1a237e; }
    .tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
    .tabs button {
      padding: 10px 20px;
      border: 1px solid #ccc;
      background: white;
      border-radius: 6px;
      cursor: pointer;
    }
    .tabs button.active { background: #1a237e; color: white; border-color: #1a237e; }
    .form-inline { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
    .form-inline input, .form-inline select {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 0.9rem;
    }
    .form-inline button {
      padding: 8px 16px;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .tabla { width: 100%; border-collapse: collapse; }
    .tabla th, .tabla td { padding: 10px 14px; border-bottom: 1px solid #eee; text-align: left; font-size: 0.9rem; }
    .tabla th { background: #f5f5f5; font-weight: 600; }
    .btn-delete { padding: 4px 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 0.78rem; }
    .badge.pendiente { background: #fff3e0; color: #e65100; }
    .badge.confirmada, .badge.aprobado { background: #e8f5e9; color: #2e7d32; }
    .badge.cancelada, .badge.rechazado { background: #fce4ec; color: #c62828; }
    .mensaje { margin-top: 16px; padding: 10px; background: #e8f5e9; color: #2e7d32; border-radius: 6px; }
  `]
})
export class AdminComponent implements OnInit {
  tab = 'canchas';
  canchas: any[] = [];
  horarios: any[] = [];
  reservas: any[] = [];
  pagos: any[] = [];
  mensaje = '';

  nuevaCancha = { nombre: '', ubicacion: '', tipo: '', activa: true };
  nuevoHorario = { idCancha: '', fecha: '', horaInicio: '', horaFin: '', disponible: true };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.api.getCanchas().subscribe(d => this.canchas = d);
    this.api.getHorarios().subscribe(d => this.horarios = d);
    this.api.getReservas().subscribe(d => this.reservas = d);
    this.api.getPagos().subscribe(d => this.pagos = d);
  }

  crearCancha(): void {
    this.api.createCancha(this.nuevaCancha).subscribe(() => {
      this.mensaje = 'Cancha creada';
      this.nuevaCancha = { nombre: '', ubicacion: '', tipo: '', activa: true };
      this.api.getCanchas().subscribe(d => this.canchas = d);
    });
  }

  eliminarCancha(id: number): void {
    this.api.deleteCancha(id).subscribe(() => {
      this.canchas = this.canchas.filter(c => c.id !== id);
      this.mensaje = 'Cancha eliminada';
    });
  }

  crearHorario(): void {
    const body = { ...this.nuevoHorario, idCancha: Number(this.nuevoHorario.idCancha) };
    this.api.createHorario(body).subscribe(() => {
      this.mensaje = 'Horario creado';
      this.nuevoHorario = { idCancha: '', fecha: '', horaInicio: '', horaFin: '', disponible: true };
      this.api.getHorarios().subscribe(d => this.horarios = d);
    });
  }

  eliminarHorario(id: number): void {
    this.api.deleteHorario(id).subscribe(() => {
      this.horarios = this.horarios.filter(h => h.id !== id);
      this.mensaje = 'Horario eliminado';
    });
  }
}
