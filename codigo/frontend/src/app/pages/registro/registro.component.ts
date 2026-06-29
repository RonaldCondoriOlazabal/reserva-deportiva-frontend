import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../../core/keycloak.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="registro-page">
      <div class="registro-bg"></div>
      <div class="registro-card animate-in">
        @if (paso() === 1) {
          <div class="registro-header">
            <div class="logo">🏟️</div>
            <h1>Crear cuenta</h1>
            <p>Selecciona el tipo de cuenta que deseas registrar</p>
          </div>

          <div class="tipo-grid">
            <button type="button" class="tipo-card" (click)="seleccionarTipo('cliente')">
              <span class="tipo-icon">👤</span>
              <strong>Cliente</strong>
              <small>Reservar canchas de fútbol y vóley</small>
            </button>
            <button type="button" class="tipo-card dueno" (click)="seleccionarTipo('dueno')">
              <span class="tipo-icon">🏢</span>
              <strong>Dueño de cancha</strong>
              <small>Registrar y administrar tus canchas</small>
            </button>
          </div>
        } @else {
          <div class="registro-header">
            <div class="logo">{{ tipo() === 'dueno' ? '🏢' : '👤' }}</div>
            <h1>Registro como {{ tipo() === 'dueno' ? 'dueño' : 'cliente' }}</h1>
            <p>{{ descripcion() }}</p>
          </div>

          <div class="steps">
            @for (step of pasos(); track step) {
              <div class="step"><span>{{ $index + 1 }}</span> {{ step }}</div>
            }
          </div>

          <button type="button" class="btn btn-primary btn-lg btn-block" (click)="irAKeycloak()">
            Continuar con el registro
          </button>
          <button type="button" class="btn btn-ghost btn-block" style="margin-top:10px" (click)="paso.set(1)">
            ← Cambiar tipo de cuenta
          </button>
        }

        <a routerLink="/login" class="link-login">Ya tengo cuenta — Iniciar sesión</a>
      </div>
    </div>
  `,
  styles: [`
    .registro-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;
      position: relative;
    }
    .registro-bg {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(11, 31, 51, 0.92), rgba(30, 77, 43, 0.88)),
        url('https://images.unsplash.com/photo-1459865269929-5b1c658c80b5?w=1920&q=80') center/cover;
    }
    .registro-card {
      position: relative; z-index: 1;
      background: linear-gradient(180deg, #f8faf9 0%, #eef4f0 100%);
      border-radius: var(--radius-xl);
      padding: 36px; max-width: 520px; width: 100%;
      box-shadow: var(--shadow-lg);
      border: 1px solid rgba(22, 163, 74, 0.15);
    }
    .registro-header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 3rem; margin-bottom: 12px; }
    .registro-header h1 { font-size: 1.5rem; font-weight: 800; color: var(--color-primary); }
    .registro-header p { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 8px; }
    .tipo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
    .tipo-card {
      background: linear-gradient(180deg, #F4F8FA 0%, #E8F0EB 100%);
      border: 2px solid var(--color-border); border-radius: var(--radius-lg);
      padding: 24px 16px; text-align: center; cursor: pointer;
      transition: all var(--transition); display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .tipo-card:hover { border-color: var(--color-accent); background: var(--color-accent-light); transform: translateY(-2px); }
    .tipo-card.dueno:hover { border-color: #D97706; background: #FEF3C7; }
    .tipo-icon { font-size: 2rem; }
    .tipo-card strong { font-size: 0.9375rem; color: var(--color-primary); }
    .tipo-card small { font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.3; }
    .steps { margin-bottom: 24px; }
    .step {
      display: flex; align-items: center; gap: 12px; padding: 10px 0;
      font-size: 0.875rem; border-bottom: 1px solid var(--color-border);
    }
    .step:last-child { border-bottom: none; }
    .step span {
      width: 28px; height: 28px; border-radius: 50%; background: var(--color-accent);
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8125rem; flex-shrink: 0;
    }
    .link-login {
      display: block; text-align: center; margin-top: 20px;
      font-size: 0.875rem; color: var(--color-accent); font-weight: 600;
    }
    @media (max-width: 480px) { .tipo-grid { grid-template-columns: 1fr; } }
  `]
})
export class RegistroComponent {
  paso = signal(1);
  tipo = signal<'cliente' | 'dueno'>('cliente');

  constructor(private kc: KeycloakService) {}

  seleccionarTipo(t: 'cliente' | 'dueno'): void {
    this.tipo.set(t);
    this.kc.setRegistroTipo(t);
    this.paso.set(2);
  }

  descripcion = () =>
    this.tipo() === 'dueno'
      ? 'Podrás registrar tus canchas después de que el administrador apruebe tu solicitud.'
      : 'Podrás explorar canchas, ver horarios y realizar reservas con pago.';

  pasos = () =>
    this.tipo() === 'dueno'
      ? [
          'Crea tu cuenta en el sistema',
          'Inicia sesión y envía solicitud de cancha',
          'Espera aprobación del administrador',
          'Configura horarios y gestiona reservas'
        ]
      : [
          'Crea tu cuenta en el sistema',
          'Explora canchas disponibles',
          'Selecciona horario y realiza tu reserva'
        ];

  irAKeycloak(): void {
    this.kc.setRegistroTipo(this.tipo());
    this.kc.redirectToKeycloakRegistration();
  }
}
