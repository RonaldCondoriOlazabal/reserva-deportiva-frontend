import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService, UserRole } from './keycloak.service';

export const authGuard: CanActivateFn = async () => {
  const kc = inject(KeycloakService);
  const router = inject(Router);
  await kc.waitForReady();
  if (kc.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

export const guestGuard: CanActivateFn = async (route) => {
  const kc = inject(KeycloakService);
  const router = inject(Router);
  await kc.waitForReady();
  // Si viene con ?logout=true, cerrar sesión y dejar pasar
  if (route.queryParamMap.get('logout') === 'true') {
    kc.logout();
    return true;
  }
  if (!kc.isLoggedIn()) return true;
  router.navigate([kc.getDashboardRoute()]);
  return false;
};

export const roleGuard = (role: UserRole): CanActivateFn => async () => {
  const kc = inject(KeycloakService);
  const router = inject(Router);
  await kc.waitForReady();
  if (!kc.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  if (kc.hasRole(role)) return true;
  router.navigate(['/no-autorizado']);
  return false;
};

export const rootRedirectGuard: CanActivateFn = async () => {
  const kc = inject(KeycloakService);
  const router = inject(Router);
  await kc.waitForReady();
  if (kc.isLoggedIn()) {
    router.navigate([kc.getDashboardRoute()]);
  } else {
    router.navigate(['/login']);
  }
  return false;
};

export const adminGuard = roleGuard('ADMIN');
export const duenoGuard = roleGuard('DUENO');
export const clienteGuard = roleGuard('CLIENTE');
