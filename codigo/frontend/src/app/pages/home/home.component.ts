import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KeycloakService } from '../../core/keycloak.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="hero">
      <h1>🏟️ Reservas Deportivas UPEU</h1>
      <p>Reserva tu cancha favorita de forma rapida y sencilla</p>
      <div class="actions">
        <a routerLink="/canchas" class="btn btn-primary">Ver Canchas Disponibles</a>
        <button *ngIf="!isLoggedIn" (click)="login()" class="btn btn-secondary">Iniciar Sesion</button>
        <a *ngIf="isLoggedIn" routerLink="/reservas" class="btn btn-secondary">Mis Reservas</a>
      </div>
    </div>
    <div class="features">
      <div class="feature">
        <span>⚽</span>
        <h3>Multiples Canchas</h3>
        <p>Futbol, voley y mas deportes disponibles</p>
      </div>
      <div class="feature">
        <span>📅</span>
        <h3>Horarios Flexibles</h3>
        <p>Elige el horario que mejor te convenga</p>
      </div>
      <div class="feature">
        <span>💳</span>
        <h3>Pago Facil</h3>
        <p>Yape, tarjeta o Plin</p>
      </div>
    </div>
  `,
  styles: [`
    .hero {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #1a237e, #3949ab);
      color: white;
      border-radius: 12px;
      margin-bottom: 40px;
    }
    .hero h1 { font-size: 2.5rem; margin-bottom: 16px; }
    .hero p { font-size: 1.2rem; margin-bottom: 32px; opacity: 0.9; }
    .actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
    .btn {
      padding: 12px 28px;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      text-decoration: none;
      border: none;
    }
    .btn-primary { background: #4caf50; color: white; }
    .btn-secondary { background: white; color: #1a237e; }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
    }
    .feature {
      text-align: center;
      padding: 24px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    .feature span { font-size: 2.5rem; }
    .feature h3 { margin: 12px 0 8px; }
    .feature p { color: #666; }
  `]
})
export class HomeComponent {
  isLoggedIn: boolean;
  constructor(private kc: KeycloakService) {
    this.isLoggedIn = kc.isLoggedIn();
  }
  login(): void { this.kc.login(); }
}
