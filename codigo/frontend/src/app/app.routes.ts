import { Routes } from '@angular/router';
import { authGuard, adminGuard, duenoGuard, clienteGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },

  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: 'registro/keycloak',
    loadComponent: () => import('./pages/registro/registro-keycloak.component').then(m => m.RegistroKeycloakComponent)
  },

  // Callbacks de Keycloak por tipo de registro — sin guards
  {
    path: 'auth/callback',
    loadComponent: () => import('./pages/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  },
  {
    path: 'auth/callback/dueno',
    loadComponent: () => import('./pages/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  },
  {
    path: 'auth/callback/cliente',
    loadComponent: () => import('./pages/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  },

  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'solicitudes', loadComponent: () => import('./pages/admin/admin-solicitudes.component').then(m => m.AdminSolicitudesComponent) },
      { path: 'canchas', loadComponent: () => import('./pages/admin/admin-canchas.component').then(m => m.AdminCanchasComponent) }
    ]
  },

  {
    path: 'dueno',
    canActivate: [authGuard, duenoGuard],
    loadComponent: () => import('./pages/dueno/dueno-shell.component').then(m => m.DuenoShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dueno/dueno-dashboard.component').then(m => m.DuenoDashboardComponent) },
      { path: 'mis-canchas', loadComponent: () => import('./pages/dueno/dueno-mis-canchas.component').then(m => m.DuenoMisCanchasComponent) },
      { path: 'registrar', loadComponent: () => import('./pages/dueno/dueno-registrar.component').then(m => m.DuenoRegistrarComponent) },
      { path: 'horarios', loadComponent: () => import('./pages/dueno/dueno-horarios.component').then(m => m.DuenoHorariosComponent) },
      { path: 'canchas', loadComponent: () => import('./pages/cliente/cliente-canchas.component').then(m => m.ClienteCanchasComponent) },
      { path: 'canchas/:id', loadComponent: () => import('./pages/cliente/cliente-cancha-detalle.component').then(m => m.ClienteCanchaDetalleComponent) },
      { path: 'reservas', loadComponent: () => import('./pages/dueno/dueno-reservas.component').then(m => m.DuenoReservasComponent) },
      { path: 'perfil', loadComponent: () => import('./pages/dueno/dueno-perfil.component').then(m => m.DuenoPerfilComponent) }
    ]
  },

  {
    path: 'cliente',
    canActivate: [authGuard, clienteGuard],
    loadComponent: () => import('./pages/cliente/cliente-shell.component').then(m => m.ClienteShellComponent),
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', loadComponent: () => import('./pages/cliente/cliente-inicio.component').then(m => m.ClienteInicioComponent) },
      { path: 'canchas', loadComponent: () => import('./pages/cliente/cliente-canchas.component').then(m => m.ClienteCanchasComponent) },
      { path: 'canchas/:id', loadComponent: () => import('./pages/cliente/cliente-cancha-detalle.component').then(m => m.ClienteCanchaDetalleComponent) },
      { path: 'mis-reservas', loadComponent: () => import('./pages/cliente/cliente-mis-reservas.component').then(m => m.ClienteMisReservasComponent) },
      { path: 'pagos', loadComponent: () => import('./pages/cliente/cliente-pagos.component').then(m => m.ClientePagosComponent) },
      { path: 'pago/:reservaId', loadComponent: () => import('./pages/cliente/cliente-pago.component').then(m => m.ClientePagoComponent) },
      { path: 'comprobante/:pagoId', loadComponent: () => import('./pages/cliente/cliente-comprobante.component').then(m => m.ClienteComprobanteComponent) },
      { path: 'perfil', loadComponent: () => import('./pages/cliente/cliente-perfil.component').then(m => m.ClientePerfilComponent) }
    ]
  },

  {
    path: 'no-autorizado',
    loadComponent: () => import('./pages/no-autorizado/no-autorizado.component').then(m => m.NoAutorizadoComponent)
  },

  { path: '**', redirectTo: 'login' }
];
