import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardLayoutComponent, NavItem } from '../../shared/layout/dashboard-layout.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout
      roleClass="role-admin"
      roleLabel="Administrador"
      [navItems]="navItems"
    >
      <router-outlet />
    </app-dashboard-layout>
  `
})
export class AdminShellComponent {
  navItems: NavItem[] = [
    { label: 'Panel', icon: '📊', route: '/admin/dashboard' },
    { label: 'Solicitudes', icon: '📋', route: '/admin/solicitudes' },
    { label: 'Canchas', icon: '🏟️', route: '/admin/canchas' }
  ];
}
