import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Usuario } from '../../core/models/cancha.model';
import { ConfirmModalComponent } from '../../shared/ui/ui.components';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Administrador / <span>Usuarios</span></nav>
      <h1 class="page-title">Gestión de Usuarios</h1>
      <p class="page-subtitle">Usuarios registrados en el sistema</p>
    </div>

    <div class="card" style="margin-bottom:24px">
      <div class="card-body">
        <h3 style="margin-bottom:16px">Nuevo usuario</h3>
        <div class="form-row">
          <input class="form-control" [(ngModel)]="nuevo.username" placeholder="Usuario" />
          <input class="form-control" [(ngModel)]="nuevo.email" placeholder="Email" type="email" />
          <input class="form-control" [(ngModel)]="nuevo.password" placeholder="Contraseña" type="password" />
          <select class="form-control" [(ngModel)]="nuevo.rol">
            <option value="ADMIN">Administrador</option>
            <option value="USER">Usuario</option>
          </select>
          <button class="btn btn-primary" (click)="crear()">Crear</button>
        </div>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div></div>
    } @else {
      <div class="table-wrap card">
        <table class="data-table">
          <thead>
            <tr><th>ID</th><th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            @for (u of usuarios(); track u.id) {
              <tr>
                <td>{{ u.id }}</td>
                <td><strong>{{ u.username }}</strong></td>
                <td>{{ u.email }}</td>
                <td><span class="badge badge-info">{{ u.rol }}</span></td>
                <td><span class="badge" [class]="u.activo ? 'badge-success' : 'badge-danger'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span></td>
                <td>
                  <button class="btn btn-danger btn-sm" (click)="confirmDelete(u)">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="card" style="margin-top:24px">
        <div class="card-body">
          <h3>Usuarios de Keycloak (referencia)</h3>
          <div class="ref-users">
            @for (u of keycloakUsers; track u.user) {
              <div class="ref-chip"><strong>{{ u.role }}</strong> · {{ u.user }}</div>
            }
          </div>
        </div>
      </div>
    }

    <app-confirm-modal
      [open]="!!deleteTarget()"
      title="Eliminar usuario"
      [message]="'¿Eliminar al usuario ' + (deleteTarget()?.username ?? '') + '?'"
      confirmLabel="Eliminar"
      [danger]="true"
      (confirm)="eliminar()"
      (cancel)="deleteTarget.set(null)"
    />
  `,
  styles: [`
    .form-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .form-row .form-control { flex: 1; min-width: 140px; }
    .ref-users { display: flex; flex-wrap: wrap; gap: 8px; }
    .ref-chip {
      background: var(--color-bg);
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      border: 1px solid var(--color-border);
    }
  `]
})
export class AdminUsuariosComponent implements OnInit {
  usuarios = signal<Usuario[]>([]);
  loading = signal(true);
  deleteTarget = signal<Usuario | null>(null);
  nuevo = { username: '', email: '', password: '', rol: 'USER', activo: true };

  keycloakUsers = [
    { role: 'Administrador', user: 'admin' },
    { role: 'Dueño', user: 'dueno1' },
    { role: 'Cliente', user: 'cliente1' }
  ];

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getUsuarios().subscribe({
      next: data => { this.usuarios.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Error al cargar usuarios'); }
    });
  }

  crear(): void {
    if (!this.nuevo.username || !this.nuevo.email || !this.nuevo.password) {
      this.toast.warning('Complete todos los campos');
      return;
    }
    this.api.createUsuario(this.nuevo).subscribe({
      next: () => {
        this.toast.success('Usuario creado');
        this.nuevo = { username: '', email: '', password: '', rol: 'USER', activo: true };
        this.load();
      },
      error: () => this.toast.error('No se pudo crear el usuario')
    });
  }

  confirmDelete(u: Usuario): void {
    this.deleteTarget.set(u);
  }

  eliminar(): void {
    const u = this.deleteTarget();
    if (!u) return;
    this.api.deleteUsuario(u.id).subscribe({
      next: () => {
        this.toast.success('Usuario eliminado');
        this.deleteTarget.set(null);
        this.load();
      },
      error: () => this.toast.error('No se pudo eliminar')
    });
  }
}
