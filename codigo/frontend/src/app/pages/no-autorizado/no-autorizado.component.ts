import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from '../../core/keycloak.service';

@Component({
  selector: 'app-no-autorizado',
  standalone: true,
  imports: [],
  template: `
    <div class="error-page">
      <div class="error-card animate-in">
        <div class="error-icon">🚫</div>
        <h1>Acceso denegado</h1>
        <p>No tienes permisos para acceder a esta sección.</p>
        <a [href]="dashboardRoute" class="btn btn-primary">Ir a mi panel</a>
        <button class="btn btn-ghost" (click)="logout()">Cerrar sesión</button>
      </div>
    </div>
  `,
  styles: [`
    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg);
      padding: 20px;
    }
    .error-card {
      text-align: center;
      background: white;
      padding: 48px 40px;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      max-width: 420px;
    }
    .error-icon { font-size: 3.5rem; margin-bottom: 16px; }
    .error-card h1 { font-size: 1.5rem; margin-bottom: 8px; color: var(--color-primary); }
    .error-card p { color: var(--color-text-muted); margin-bottom: 24px; }
    .error-card .btn { margin: 4px; }
  `]
})
export class NoAutorizadoComponent {
  private kc = inject(KeycloakService);
  private router = inject(Router);

  get dashboardRoute(): string {
    return this.kc.isLoggedIn() ? this.kc.getDashboardRoute() : '/login';
  }

  logout(): void {
    this.kc.logout();
    this.router.navigate(['/login']);
  }
}
