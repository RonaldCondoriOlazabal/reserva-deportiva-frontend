import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Administrador / <span>Configuración</span></nav>
      <h1 class="page-title">Configuración</h1>
      <p class="page-subtitle">Ajustes generales del sistema</p>
    </div>

    <div class="config-grid">
      <div class="card">
        <div class="card-body">
          <h3>Conexión con la API</h3>
          <p class="config-item"><strong>Puerta de enlace:</strong> http://localhost:7091</p>
          <p class="config-item"><strong>Keycloak:</strong> http://localhost:18080</p>
          <p class="config-item"><strong>Realm:</strong> reservas</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <h3>⚙️ Parámetros</h3>
          <p class="config-item"><strong>Precio base reserva:</strong> S/ 50.00</p>
          <p class="config-item"><strong>Orígenes permitidos:</strong> localhost:4200</p>
          <p class="config-item"><strong>Versión frontend:</strong> 2.0.0</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <h3>Roles del sistema</h3>
          <div class="roles-list">
            <span class="badge badge-info">Administrador</span>
            <span class="badge badge-warning">Dueño</span>
            <span class="badge badge-success">Cliente</span>
          </div>
          <p class="hint">Los roles se gestionan en Keycloak y se validan en la puerta de enlace (API Gateway).</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    .config-grid h3 { margin-bottom: 16px; font-size: 1rem; }
    .config-item { font-size: 0.875rem; margin-bottom: 8px; color: var(--color-text-muted); }
    .config-item strong { color: var(--color-text); }
    .roles-list { display: flex; gap: 8px; margin-bottom: 12px; }
    .hint { font-size: 0.8125rem; color: var(--color-text-muted); }
  `]
})
export class AdminConfigComponent {}
