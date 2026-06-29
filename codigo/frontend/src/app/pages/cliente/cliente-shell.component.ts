import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardLayoutComponent, NavItem } from '../../shared/layout/dashboard-layout.component';

@Component({
  selector: 'app-cliente-shell',
  standalone: true,
  imports: [RouterOutlet, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout
      roleClass="role-cliente"
      roleLabel="Cliente"
      [navItems]="navItems"
    >
      <router-outlet />
    </app-dashboard-layout>
  `
})
export class ClienteShellComponent {
  navItems: NavItem[] = [
    { label: 'Inicio', icon: '🏠', route: '/cliente/inicio' },
    { label: 'Canchas', icon: '🏟️', route: '/cliente/canchas' },
    { label: 'Mis Reservas', icon: '📅', route: '/cliente/mis-reservas' },
    { label: 'Historial Pagos', icon: '💳', route: '/cliente/pagos' },
    { label: 'Perfil', icon: '👤', route: '/cliente/perfil' }
  ];
}
