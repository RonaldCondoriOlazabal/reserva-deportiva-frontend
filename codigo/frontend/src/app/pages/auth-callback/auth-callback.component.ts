import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from '../../core/keycloak.service';
import { UserProfileService } from '../../core/user-profile.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="callback-page">
      <div class="spinner"></div>
      <p>Completando registro...</p>
    </div>
  `,
  styles: [`
    .callback-page {
      min-height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 16px;
      background: linear-gradient(135deg, #0B1F33, #1E4D2B); color: white;
    }
    .spinner {
      width: 40px; height: 40px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AuthCallbackComponent implements OnInit {
  private kc = inject(KeycloakService);
  private profile = inject(UserProfileService);
  private router = inject(Router);
  private toast = inject(ToastService);

  async ngOnInit(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // Detectar tipo desde la URL del path (más confiable que state o localStorage)
    const path = window.location.pathname; // e.g. /auth/callback/dueno
    const tipoDelPath = path.endsWith('/dueno') ? 'dueno'
      : path.endsWith('/cliente') ? 'cliente'
      : null;

    // Fallback a localStorage si no hay info en el path
    const tipo: 'dueno' | 'cliente' =
      tipoDelPath
      ?? this.kc.getRegistroTipo()
      ?? (localStorage.getItem('registro_tipo_pendiente') as 'dueno' | 'cliente' | null)
      ?? 'cliente';

    const roleFinal: 'ADMIN' | 'DUENO' | 'CLIENTE' = tipo === 'dueno' ? 'DUENO' : 'CLIENTE';

    if (!code) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      // El redirect_uri debe coincidir exactamente con lo enviado en el registro
      const redirectUri = window.location.origin + path;
      await this.kc.exchangeCodeForToken(code, redirectUri);
      window.history.replaceState({}, '', path);

      const username = this.kc.getUsername();
      if (!username) {
        this.router.navigate(['/login']);
        return;
      }

      // Guardar el override de rol y limpiar el tipo pendiente
      this.kc.setRoleOverride(username, roleFinal);
      this.kc.clearRegistroTipo();

      this.profile.ensureUsuario(username, this.kc.getEmail(), roleFinal).subscribe({
        next: () => {
          const label = roleFinal === 'DUENO' ? 'dueño de cancha' : 'cliente';
          this.toast.success(`¡Bienvenido! Tu cuenta fue creada como ${label}.`);
          this.router.navigate([this.kc.getDashboardRoute()]);
        },
        error: () => {
          this.router.navigate([this.kc.getDashboardRoute()]);
        }
      });
    } catch (e) {
      console.error('[AuthCallback] Error:', e);
      this.router.navigate(['/login']);
    }
  }
}
