import { Component, Input, signal, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../../core/keycloak.service';
import { UserProfileService } from '../../core/user-profile.service';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="layout" [class]="roleClass">
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="sidebar-brand">
          <span class="brand-icon">🏟️</span>
          <div>
            <strong>Reserva Deportiva</strong>
            <small>{{ roleLabel }}</small>
          </div>
        </div>
        <nav class="sidebar-nav">
          @for (item of navItems; track item.route) {
            <a [routerLink]="item.route" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen.set(false)">
              <span class="nav-icon">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>

      @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="sidebarOpen.set(false)"></div>
      }

      <div class="main-area">
        <header class="topbar">
          <button class="menu-toggle" (click)="sidebarOpen.update(v => !v)">☰</button>
          <div class="topbar-right">
            <div class="profile">
              @if (photoUrl) {
                <img [src]="photoUrl" alt="" class="avatar avatar-img" />
              } @else {
                <div class="avatar">{{ initials }}</div>
              }
              <div class="profile-info">
                <strong>{{ displayName }}</strong>
              </div>
            </div>
            <div class="topbar-divider"></div>
            <button class="btn-logout-subtle" (click)="logout()" title="Cerrar sesión">
              ↩ Salir
            </button>
          </div>
        </header>
        <main class="content">
          <ng-content />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      --sidebar-accent: var(--color-accent);
    }
    .role-admin  { --sidebar-accent: #6366F1; }
    .role-dueno  { --sidebar-accent: #F59E0B; }
    .role-cliente{ --sidebar-accent: #10B981; }

    /* ── Sidebar ── */
    .sidebar {
      width: var(--sidebar-width);
      background: var(--color-primary);
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0; bottom: 0;
      z-index: 200;
      transition: transform var(--transition);
    }
    .sidebar-brand {
      padding: 24px 20px;
      display: flex; align-items: center; gap: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .brand-icon { font-size: 1.75rem; }
    .sidebar-brand strong { display: block; font-size: 1rem; color: #fff; }
    .sidebar-brand small  { color: rgba(255,255,255,0.55); font-size: 0.75rem; }

    .sidebar-nav { padding: 16px 12px; flex: 1; }
    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 14px; border-radius: var(--radius-sm);
      color: rgba(255,255,255,0.7);
      font-size: 0.875rem; font-weight: 500;
      margin-bottom: 4px;
      transition: all var(--transition);
    }
    .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .nav-item.active {
      background: var(--sidebar-accent);
      color: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .nav-icon { font-size: 1.1rem; width: 24px; text-align: center; }

    /* ── Main area con foto de fondo ── */
    .main-area {
      flex: 1;
      margin-left: var(--sidebar-width);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      /* Foto de fondo con overlay gris muy suave para que la foto se vea difuminada */
      background:
        url('https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1920&q=85') center / cover no-repeat;
    }

    /* ── Topbar ── */
    .topbar {
      height: var(--navbar-height);
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(11,31,51,0.08);
      display: flex; align-items: center;
      justify-content: flex-end;
      padding: 0 28px;
      position: sticky; top: 0; z-index: 100;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .menu-toggle {
      display: none; background: none; border: none;
      font-size: 1.25rem; cursor: pointer; padding: 8px;
      margin-right: auto;
    }
    .topbar-right { display: flex; align-items: center; gap: 16px; }
    .profile { display: flex; align-items: center; gap: 12px; }
    .avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--sidebar-accent, var(--color-accent));
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; font-weight: 700; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .avatar-img { object-fit: cover; }
    .profile-info strong {
      display: block; font-size: 0.9375rem;
      font-weight: 700; color: #0B1F33;
    }
    .topbar-divider {
      width: 1px; height: 28px;
      background: rgba(11,31,51,0.1);
    }
    .btn-logout-subtle {
      display: flex; align-items: center; gap: 6px;
      background: none;
      border: 1.5px solid rgba(11,31,51,0.12);
      cursor: pointer;
      font-size: 0.8125rem; font-weight: 600;
      color: #5B6B7C;
      padding: 6px 14px; border-radius: var(--radius-sm);
      transition: all var(--transition);
    }
    .btn-logout-subtle:hover {
      color: #EF4444;
      border-color: #FECACA;
      background: #FEF2F2;
    }

    /* ── Content ── */
    .content {
      padding: 28px 32px;
      flex: 1;
    }

    /* Wrapper blanco centrado que envuelve todo el contenido */
    .content > * {
      position: relative;
      z-index: 1;
    }

    /* ── Overlay mobile ── */
    .sidebar-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.4); z-index: 150;
    }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .sidebar { transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .sidebar-overlay { display: block; }
      .main-area { margin-left: 0; }
      .menu-toggle { display: block; }
      .content { padding: 20px 16px; }
      .profile-info { display: none; }
    }
  `]
})
export class DashboardLayoutComponent {
  @Input({ required: true }) navItems: NavItem[] = [];
  @Input({ required: true }) roleClass = '';
  @Input({ required: true }) roleLabel = '';

  sidebarOpen = signal(false);
  username = '';
  displayName = '';
  initials = '';
  photoUrl?: string;

  private router = inject(Router);

  constructor(private kc: KeycloakService, private profile: UserProfileService) {
    this.username = this.kc.getUsername() ?? '';
    const p = this.profile.getProfile(this.username);
    this.displayName = p.displayName;
    this.initials = this.profile.getInitials(this.username);
    this.photoUrl = p.photoUrl;
  }

  logout(): void {
    this.kc.logout();
    this.router.navigate(['/login']);
  }
}
