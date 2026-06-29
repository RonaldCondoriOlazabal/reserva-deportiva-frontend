import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardLayoutComponent, NavItem } from '../../shared/layout/dashboard-layout.component';

@Component({
  selector: 'app-dueno-shell',
  standalone: true,
  imports: [RouterOutlet, DashboardLayoutComponent],
  template: `
    <app-dashboard-layout
      roleClass="role-dueno"
      roleLabel="Dueño de cancha"
      [navItems]="navItems"
    >
      <router-outlet />
    </app-dashboard-layout>
  `
})
export class DuenoShellComponent {
  navItems: NavItem[] = [
    { label: 'Panel', icon: '📊', route: '/dueno/dashboard' },
    { label: 'Mis canchas', icon: '🏟️', route: '/dueno/mis-canchas' },
    { label: 'Registrar cancha', icon: '➕', route: '/dueno/registrar' },
    { label: 'Horarios', icon: '📅', route: '/dueno/horarios' },
    { label: 'Ver canchas', icon: '🔍', route: '/dueno/canchas' },
    { label: 'Reservas', icon: '📋', route: '/dueno/reservas' },
    { label: 'Perfil', icon: '👤', route: '/dueno/perfil' }
  ];
}
