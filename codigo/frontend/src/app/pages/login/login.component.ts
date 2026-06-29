import { Component, signal, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../../core/keycloak.service';
import { UserProfileService } from '../../core/user-profile.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-bg"></div>
      <div class="login-container animate-in">
        <div class="login-card">
          <div class="login-header">
            <div class="logo">⚽</div>
            <h1>Reserva Deportiva</h1>
            <p>Sistema de reservas de canchas deportivas</p>
          </div>

          <form (ngSubmit)="onSubmit()" novalidate>
            <div class="form-group">
              <label class="form-label">Usuario</label>
              <input
                class="form-control"
                [class.error]="submitted && !username.trim()"
                [(ngModel)]="username"
                name="username"
                placeholder="Ingrese su usuario"
                autocomplete="username"
              />
              @if (submitted && !username.trim()) {
                <p class="form-error">El usuario es obligatorio</p>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <div class="input-group">
                <input
                  class="form-control"
                  [class.error]="submitted && !password"
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Ingrese su contraseña"
                  autocomplete="current-password"
                />
                <button type="button" class="input-toggle" (click)="showPassword.update(v => !v)">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (submitted && !password) {
                <p class="form-error">La contraseña es obligatoria</p>
              }
            </div>

            @if (errorMsg()) {
              <div class="login-error" role="alert">{{ errorMsg() }}</div>
            }

            <button type="submit" class="btn btn-primary btn-lg btn-block" [disabled]="loading()">
              @if (loading()) {
                <span class="btn-spinner"></span>
                <span>Ingresando...</span>
              } @else {
                <span>Iniciar sesión</span>
              }
            </button>
          </form>

          <div class="register-links">
            <p>¿No tienes cuenta?</p>
            <a routerLink="/registro" class="btn btn-secondary btn-block">Registrarse</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }
    .login-bg {
      position: absolute; inset: 0;
      background:
        linear-gradient(135deg, rgba(11, 31, 51, 0.94) 0%, rgba(30, 77, 43, 0.88) 100%),
        url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80') center/cover;
    }
    .login-container { position: relative; z-index: 1; width: 100%; max-width: 440px; padding: 20px; }
    .login-card {
      background: linear-gradient(180deg, #f8faf9 0%, #eef4f0 100%);
      border-radius: var(--radius-xl);
      padding: 40px 36px;
      box-shadow: var(--shadow-lg);
      border: 1px solid rgba(22, 163, 74, 0.15);
    }
    .login-header { text-align: center; margin-bottom: 28px; }
    .logo {
      width: 72px; height: 72px;
      background: linear-gradient(135deg, var(--color-accent), var(--color-accent-dark));
      border-radius: 20px; display: flex; align-items: center; justify-content: center;
      font-size: 2.25rem; margin: 0 auto 16px; box-shadow: var(--shadow-accent);
    }
    .login-header h1 { font-size: 1.75rem; font-weight: 800; color: var(--color-primary); }
    .login-header p { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 4px; }
    .login-error {
      background: #FEF2F2; color: #991B1B; padding: 12px 14px;
      border-radius: var(--radius-sm); font-size: 0.875rem; margin-bottom: 16px;
      border: 1px solid #FECACA; line-height: 1.4;
    }
    .btn-spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.7s linear infinite; display: inline-block; margin-right: 8px;
    }
    .register-links {
      margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--color-border);
      text-align: center;
    }
    .register-links p { font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 12px; }
    @media (max-width: 480px) { .login-card { padding: 28px 20px; } }
  `]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  submitted = false;
  loading = signal(false);
  showPassword = signal(false);
  errorMsg = signal('');  constructor(
    private kc: KeycloakService,
    private router: Router,
    private route: ActivatedRoute,
    private profile: UserProfileService,
    private toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.kc.waitForReady();
    const code = this.route.snapshot.queryParamMap.get('code');
    if (!code) return;

    this.loading.set(true);
    try {
      await this.kc.exchangeCodeForToken(code, window.location.origin + '/login');
      // Aplicar el rol del registro usando el username ya disponible en el token
      const username = this.kc.getUsername();
      if (username) {
        this.kc.applyRegistroRoleOverrideForUser(username);
      }
      // Limpiar el ?code de la URL sin recargar
      window.history.replaceState({}, '', '/login');
      await this.finalizarIngreso();
    } catch (e: unknown) {
      this.errorMsg.set(e instanceof Error ? e.message : 'No se pudo completar el registro');
      window.history.replaceState({}, '', '/login');
    } finally {
      this.loading.set(false);
    }
  }

  cerrarSesionActual(): void {
    this.kc.logout();
    this.toast.info('Sesión cerrada.');
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.errorMsg.set('');
    if (!this.username.trim() || !this.password) return;

    this.loading.set(true);
    try {
      await this.kc.loginWithCredentials(this.username.trim(), this.password);
      await this.finalizarIngreso();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo iniciar sesión';
      this.errorMsg.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  private async finalizarIngreso(): Promise<void> {
    const username = this.kc.getUsername() ?? this.username.trim();
    // Si hay tipo de registro pendiente aún no aplicado, aplicarlo ahora
    if (this.kc.getRegistroTipo() && username) {
      this.kc.applyRegistroRoleOverrideForUser(username);
    }
    const role = this.kc.getPrimaryRole();
    return new Promise((resolve) => {
      this.profile.ensureUsuario(username, this.kc.getEmail(), role ?? 'CLIENTE').subscribe({
        next: () => {
          this.toast.success(`Bienvenido, ${this.profile.getDisplayName(username)}`);
          const route = this.kc.getDashboardRoute();
          if (route === '/login') {
            this.errorMsg.set('Su cuenta no tiene un rol asignado. Contacte al administrador.');
            this.kc.logout();
            resolve();
            return;
          }
          this.router.navigate([route]);
          resolve();
        },
        error: () => {
          this.toast.success(`Bienvenido, ${username}`);
          this.router.navigate([this.kc.getDashboardRoute()]);
          resolve();
        }
      });
    });
  }
}
