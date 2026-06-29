import { Injectable, signal } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../environments/environment';

export type UserRole = 'ADMIN' | 'DUENO' | 'CLIENTE';

const SESSION_KEY = 'reservas_auth_session';
const REGISTRO_TIPO_KEY = 'registro_tipo_pendiente';
const ROLE_OVERRIDE_KEY = 'reservas_role_override';

const ERRORES_KEYCLOAK: Record<string, string> = {
  invalid_grant: 'Usuario o contraseña incorrectos.',
  invalid_client: 'Error de configuración del cliente de autenticación.',
  unauthorized_client: 'El cliente no tiene permiso para iniciar sesión de esta forma.',
  invalid_request: 'Solicitud de autenticación inválida.',
  unknown_error: 'Error en el servidor de autenticación. Reinicie Keycloak e intente de nuevo.',
  'Invalid user credentials': 'Usuario o contraseña incorrectos.',
  'Account is not fully set up': 'La cuenta no está configurada correctamente.'
};

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private keycloak: Keycloak;
  readonly authReady = signal(false);

  constructor() {
    this.keycloak = new Keycloak({
      url: environment.keycloakUrl,
      realm: environment.keycloakRealm,
      clientId: environment.keycloakClientId
    });
  }

  async waitForReady(): Promise<void> {
    if (this.authReady()) return;
    return new Promise(resolve => {
      const tick = () => {
        if (this.authReady()) resolve();
        else setTimeout(tick, 30);
      };
      tick();
    });
  }

  async init(): Promise<boolean> {
    try {
      // Timeout de 4 segundos para el check-sso — si Keycloak tarda, continúa sin él
      await Promise.race([
        this.keycloak.init({
          onLoad: 'check-sso',
          checkLoginIframe: false,
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
        }),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000))
      ]);
    } catch {
      // Keycloak no disponible o timeout: intentar sesión guardada
    }

    if (!this.isLoggedIn()) {
      await this.restoreSession();
    }

    this.authReady.set(true);
    return this.isLoggedIn();
  }

  async loginWithCredentials(username: string, password: string): Promise<void> {
    const data = await this.fetchToken({
      grant_type: 'password',
      client_id: environment.keycloakClientId,
      username,
      password,
      scope: 'openid'
    });
    this.aplicarTokens(data);
    this.persistSession(data);
  }

  async exchangeCodeForToken(code: string, redirectUri?: string): Promise<void> {
    const data = await this.fetchToken({
      grant_type: 'authorization_code',
      client_id: environment.keycloakClientId,
      code,
      redirect_uri: redirectUri ?? window.location.origin + '/auth/callback'
    });
    this.aplicarTokens(data);
    this.persistSession(data);
    this.applyRegistroRoleOverride();
  }

  applyRegistroRoleOverride(): void {
    const tipo = this.getRegistroTipo();
    if (!tipo) return;
    const username = this.getUsername();
    if (!username) return;
    this.setRoleOverride(username, tipo === 'dueno' ? 'DUENO' : 'CLIENTE');
    this.clearRegistroTipo();
  }

  // Aplica el override usando un username explícito (para cuando el token ya está disponible)
  applyRegistroRoleOverrideForUser(username: string): void {
    const tipo = this.getRegistroTipo();
    if (!tipo || !username) return;
    this.setRoleOverride(username, tipo === 'dueno' ? 'DUENO' : 'CLIENTE');
    this.clearRegistroTipo();
  }

  redirectToKeycloakRegistration(): void {
    this.logout();
    const regUrl = `${window.location.origin}/registro/keycloak`;
    const logoutUrl =
      `${environment.keycloakUrl}/realms/${environment.keycloakRealm}/protocol/openid-connect/logout` +
      `?client_id=${environment.keycloakClientId}` +
      `&post_logout_redirect_uri=${encodeURIComponent(regUrl)}`;
    window.location.href = logoutUrl;
  }

  getKeycloakRegistrationUrl(): string {
    const tipo = this.getRegistroTipo() ?? 'cliente';
    // Usar URL de callback específica por tipo — más confiable que state o localStorage
    const callbackUrl = `${window.location.origin}/auth/callback/${tipo}`;
    const redirect = encodeURIComponent(callbackUrl);
    return `${environment.keycloakUrl}/realms/${environment.keycloakRealm}/protocol/openid-connect/registrations?client_id=${environment.keycloakClientId}&response_type=code&redirect_uri=${redirect}`;
  }

  setRoleOverride(username: string, role: UserRole): void {
    const all = this.loadRoleOverrides();
    all[username] = role;
    localStorage.setItem(ROLE_OVERRIDE_KEY, JSON.stringify(all));
  }

  getRoleOverride(username?: string): UserRole | null {
    const user = username ?? this.getUsername();
    if (!user) return null;
    const role = this.loadRoleOverrides()[user];
    return role === 'ADMIN' || role === 'DUENO' || role === 'CLIENTE' ? role : null;
  }

  private loadRoleOverrides(): Record<string, UserRole> {
    try {
      return JSON.parse(localStorage.getItem(ROLE_OVERRIDE_KEY) ?? '{}');
    } catch {
      return {};
    }
  }

  getEmail(): string | undefined {
    const parsed = this.keycloak.tokenParsed as Record<string, unknown> | undefined;
    return (parsed?.['email'] as string) ?? undefined;
  }

  private async fetchToken(params: Record<string, string>): Promise<{
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in?: number;
  }> {
    const body = new URLSearchParams(params);
    const url = `${environment.keycloakUrl}/realms/${environment.keycloakRealm}/protocol/openid-connect/token`;

    let lastError: Error | null = null;
    for (let i = 0; i < 3; i++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(this.traducirError(err.error, err.error_description));
        }
        return await res.json();
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          lastError = new Error('Keycloak no responde (timeout). Verifique que esté activo en el puerto 18080.');
        } else {
          lastError = e instanceof Error ? e : new Error('Error de autenticación');
        }
        if (lastError.message.includes('incorrectos') || lastError.message.includes('Credenciales')) {
          throw lastError;
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    throw lastError ?? new Error('No se pudo conectar con Keycloak (puerto 18080). Verifique que esté activo.');
  }

  private persistSession(data: {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in?: number;
  }): void {
    const session = JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      id_token: data.id_token,
      expires_at: Date.now() + (data.expires_in ?? 300) * 1000
    });
    // Guardar en localStorage para sobrevivir refrescos de página
    localStorage.setItem(SESSION_KEY, session);
    sessionStorage.setItem(SESSION_KEY, session);
  }

  private async restoreSession(): Promise<boolean> {
    try {
      // Intentar localStorage primero (sobrevive refrescos), luego sessionStorage
      const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (!s.access_token) return false;

      const expiring = s.expires_at && s.expires_at < Date.now() + 60_000;
      if (expiring && s.refresh_token) {
        const data = await this.fetchToken({
          grant_type: 'refresh_token',
          client_id: environment.keycloakClientId,
          refresh_token: s.refresh_token
        });
        this.aplicarTokens(data);
        this.persistSession(data);
        return true;
      }
      if (expiring) {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        return false;
      }

      this.aplicarTokens(s);
      return true;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
  }

  private aplicarTokens(data: {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
  }): void {
    this.keycloak.token = data.access_token;
    this.keycloak.refreshToken = data.refresh_token;
    this.keycloak.idToken = data.id_token;
    this.keycloak.authenticated = true;
    this.keycloak.tokenParsed = this.decodificarJwt(data.access_token) as Keycloak.KeycloakTokenParsed;
    const parsed = this.keycloak.tokenParsed as Record<string, unknown>;
    this.keycloak.realmAccess = (parsed?.['realm_access'] as Keycloak.KeycloakTokenParsed['realm_access'])
      ?? { roles: (parsed?.['roles'] as string[]) ?? [] };
    this.keycloak.timeSkew = 0;
  }

  private decodificarJwt(token: string): Record<string, unknown> {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }

  private traducirError(code?: string, description?: string): string {
    if (description && ERRORES_KEYCLOAK[description]) return ERRORES_KEYCLOAK[description];
    if (code && ERRORES_KEYCLOAK[code]) return ERRORES_KEYCLOAK[code];
    if (description?.includes('Invalid user credentials')) return 'Usuario o contraseña incorrectos.';
    if (description) return description;
    return 'No se pudo iniciar sesión. Verifique sus credenciales.';
  }

  setRegistroTipo(tipo: 'cliente' | 'dueno'): void {
    // Usar localStorage para sobrevivir la redirección a Keycloak
    localStorage.setItem(REGISTRO_TIPO_KEY, tipo);
  }

  getRegistroTipo(): 'cliente' | 'dueno' | null {
    const t = localStorage.getItem(REGISTRO_TIPO_KEY) ?? sessionStorage.getItem(REGISTRO_TIPO_KEY);
    return t === 'dueno' || t === 'cliente' ? t : null;
  }

  clearRegistroTipo(): void {
    localStorage.removeItem(REGISTRO_TIPO_KEY);
    sessionStorage.removeItem(REGISTRO_TIPO_KEY);
  }

  login(): void {
    this.keycloak.login({ redirectUri: window.location.origin + '/login' });
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    this.keycloak.authenticated = false;
    this.keycloak.token = undefined;
    this.keycloak.refreshToken = undefined;
    this.keycloak.idToken = undefined;
    this.keycloak.tokenParsed = undefined;
    this.keycloak.realmAccess = undefined;
  }

  getToken(): string | undefined {
    return this.keycloak.token;
  }

  getUsername(): string | undefined {
    return this.keycloak.tokenParsed?.['preferred_username'];
  }

  getRoles(): string[] {
    const parsed = this.keycloak.tokenParsed as Record<string, unknown> | undefined;
    const custom = parsed?.['roles'];
    if (Array.isArray(custom) && custom.length) return custom as string[];
    return this.keycloak.realmAccess?.roles ?? [];
  }

  getPrimaryRole(): UserRole | null {
    // Primero intentar leer rol desde el JWT (usuarios con rol asignado en Keycloak)
    const roles = this.getRoles();
    if (roles.includes('ADMIN')) return 'ADMIN';
    if (roles.includes('DUENO')) return 'DUENO';
    if (roles.includes('CLIENTE')) return 'CLIENTE';
    // Si el JWT no tiene rol (usuario recién registrado), usar el override local
    const override = this.getRoleOverride();
    if (override) return override;
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.keycloak.authenticated && !!this.keycloak.token;
  }

  hasRole(role: string): boolean {
    // Primero verificar JWT
    const roles = this.getRoles();
    if (roles.includes(role)) return true;
    // Si JWT no tiene ningún rol conocido, usar override local
    if (!roles.includes('ADMIN') && !roles.includes('DUENO') && !roles.includes('CLIENTE')) {
      const override = this.getRoleOverride();
      if (override) return override === role;
    }
    return false;
  }

  async updateToken(): Promise<void> {
    if (!this.keycloak.authenticated) return;
    try {
      await this.keycloak.updateToken(30);
    } catch {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.refresh_token) {
          try {
            const data = await this.fetchToken({
              grant_type: 'refresh_token',
              client_id: environment.keycloakClientId,
              refresh_token: s.refresh_token
            });
            this.aplicarTokens(data);
            this.persistSession(data);
            return;
          } catch { /* fall through */ }
        }
      }
      this.logout();
    }
  }

  getDashboardRoute(): string {
    const role = this.getPrimaryRole();
    switch (role) {
      case 'ADMIN': return '/admin/dashboard';
      case 'DUENO': return '/dueno/dashboard';
      case 'CLIENTE': return '/cliente/inicio';
      default: return '/login';
    }
  }
}
