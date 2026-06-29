import { Injectable } from '@angular/core';
import { Observable, of, switchMap, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { KeycloakService, UserRole } from './keycloak.service';

export interface UserProfileData {
  displayName: string;
  photoUrl?: string;
}

const PROFILE_KEY = 'reservas_perfiles';
const USER_IDS_KEY = 'reservas_user_ids';
const USER_NAMES_KEY = 'reservas_user_names';

const DEFAULT_NAMES: Record<string, string> = {
  admin: 'Administrador',
  dueno1: 'Juan Dueño',
  cliente1: 'María Cliente',
  user: 'Usuario de prueba'
};

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private nameByIdCache: Record<number, string> = {};

  constructor(private api: ApiService, private kc: KeycloakService) {}

  private loadAll(): Record<string, UserProfileData> {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? '{}');
    } catch {
      return {};
    }
  }

  private saveAll(data: Record<string, UserProfileData>): void {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
  }

  private loadUserIds(): Record<string, number> {
    try {
      return JSON.parse(localStorage.getItem(USER_IDS_KEY) ?? '{}');
    } catch {
      return {};
    }
  }

  storeUserId(username: string, id: number): void {
    const all = this.loadUserIds();
    all[username] = id;
    localStorage.setItem(USER_IDS_KEY, JSON.stringify(all));
    // También guardar el mapa id→nombre para que el dueño pueda verlo
    const names = this.loadUserNames();
    names[id] = this.getDisplayName(username);
    localStorage.setItem(USER_NAMES_KEY, JSON.stringify(names));
  }

  private loadUserNames(): Record<number, string> {
    try { return JSON.parse(localStorage.getItem(USER_NAMES_KEY) ?? '{}'); }
    catch { return {}; }
  }

  getProfile(username: string): UserProfileData {
    const stored = this.loadAll()[username];
    return {
      displayName: stored?.displayName ?? DEFAULT_NAMES[username] ?? username,
      photoUrl: stored?.photoUrl
    };
  }

  saveProfile(username: string, data: Partial<UserProfileData>): void {
    const all = this.loadAll();
    const current = this.getProfile(username);
    all[username] = { ...current, ...data };
    this.saveAll(all);
  }

  getUserId(username: string): number {
    const stored = this.loadUserIds()[username];
    if (stored) return stored;
    let h = 0;
    for (let i = 0; i < username.length; i++) h = ((h << 5) - h + username.charCodeAt(i)) | 0;
    return Math.abs(h) % 900 + 100;
  }

  ensureUsuario(username: string, email?: string, rol?: UserRole): Observable<number> {
    const cached = this.loadUserIds()[username];
    if (cached) return of(cached);

    const role = rol ?? this.kc.getPrimaryRole() ?? 'CLIENTE';
    return this.api.getUsuarios().pipe(
      switchMap(usuarios => {
        const found = usuarios.find(u => u.username === username);
        if (found) {
          this.storeUserId(username, found.id);
          this.nameByIdCache[found.id] = this.getDisplayName(username);
          return of(found.id);
        }
        return this.api.createUsuario({
          username,
          email: email ?? `${username}@reservas.com`,
          password: 'Registro2026!',
          rol: role,
          activo: true
        }).pipe(
          tap(u => {
            this.storeUserId(username, u.id);
            this.nameByIdCache[u.id] = this.getDisplayName(username);
          }),
          map(u => u.id)
        );
      })
    );
  }

  loadUsuarioNames(): Observable<void> {
    return this.api.getUsuarios().pipe(
      tap(usuarios => {
        for (const u of usuarios) {
          this.nameByIdCache[u.id] = this.getDisplayName(u.username);
          this.storeUserId(u.username, u.id);
        }
      }),
      map(() => void 0)
    );
  }

  getNameByUserId(idUsuario: number): string {
    // Primero cache en memoria
    if (this.nameByIdCache[idUsuario]) return this.nameByIdCache[idUsuario];
    // Luego localStorage (persiste entre sesiones)
    const stored = this.loadUserNames()[idUsuario];
    if (stored) {
      this.nameByIdCache[idUsuario] = stored;
      return stored;
    }
    return `Cliente #${idUsuario}`;
  }

  getDisplayName(username: string): string {
    return this.getProfile(username).displayName;
  }

  getPhotoUrl(username: string): string | undefined {
    return this.getProfile(username).photoUrl;
  }

  getInitials(username: string): string {
    const name = this.getDisplayName(username);
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
