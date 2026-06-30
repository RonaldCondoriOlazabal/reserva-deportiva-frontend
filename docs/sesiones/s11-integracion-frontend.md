# S11 - Integración Frontend

## 1. Propósito

Integrar el frontend Angular al ecosistema de microservicios, consumiendo todos los endpoints vía Gateway, manejando autenticación Keycloak y adaptando la UI a los tres roles del sistema: `ADMIN`, `DUENO` y `CLIENTE`.

## 2. Stack tecnológico del frontend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Angular | 22.0.0 | Framework principal |
| Angular Material | 22 | Componentes UI |
| Bootstrap | 5.3 | Grid y utilidades CSS |
| Keycloak JS | 25.0.2 | Autenticación OIDC |
| Angular SSR | — | Server-Side Rendering |
| Vitest | 4 | Testing |

## 3. Arquitectura de la aplicación

```
frontend/src/
├── app/
│   ├── core/
│   │   ├── auth.guard.ts          — Guards por rol
│   │   ├── auth.interceptor.ts    — Adjunta Bearer token
│   │   ├── keycloak.service.ts    — Manejo de sesión OIDC
│   │   └── api.service.ts         — Todos los HTTP calls
│   │
│   ├── pages/
│   │   ├── login/                 — Página de login
│   │   ├── registro/              — Registro (JWT y Keycloak)
│   │   ├── auth-callback/         — Callback OIDC
│   │   ├── admin/                 — Panel administrador
│   │   ├── dueno/                 — Panel dueño de cancha
│   │   └── cliente/               — Panel cliente/jugador
│   │
│   ├── shared/
│   │   ├── court-card/            — Tarjeta de cancha
│   │   ├── stat-card/             — Tarjeta de estadística
│   │   ├── toast-container/       — Notificaciones globales
│   │   └── dashboard-layout/      — Shell de layout
│   │
│   └── app.routes.ts              — Routing con lazy loading
│
└── environments/
    ├── environment.ts             — Dev (localhost:7092)
    └── environment.prod.ts        — Producción
```

## 4. Routing por roles

```
/login            → LoginComponent (público)
/registro         → RegistroComponent (público)

/admin            [adminGuard]
  /dashboard      → Estadísticas globales
  /solicitudes    → Aprobación de solicitudes
  /canchas        → Gestión de canchas

/dueno            [duenoGuard]
  /dashboard      → Estadísticas del dueño
  /mis-canchas    → Sus canchas registradas
  /registrar      → Registrar nueva cancha
  /horarios       → Gestión de horarios
  /canchas/:id    → Detalle de cancha
  /reservas       → Ver reservas de sus canchas
  /perfil         → Perfil del dueño

/cliente          [clienteGuard]
  /inicio         → Landing del cliente
  /canchas        → Explorar canchas disponibles
  /canchas/:id    → Detalle + reservar
  /mis-reservas   → Historial de reservas
  /pagos          → Historial de pagos
  /pago/:id       → Realizar pago de reserva
  /comprobante/:id → Comprobante de pago
  /perfil         → Perfil del cliente
```

## 5. Comunicación con el Gateway

Todo el tráfico pasa por el Gateway en `http://localhost:7092`:

```typescript
// api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl; // http://localhost:7092

  // Canchas
  getCanchas()              → GET  /api/v1/canchas
  getCanchaById(id)         → GET  /api/v1/canchas/{id}
  createCancha(data)        → POST /api/v1/canchas
  updateCancha(id, data)    → PUT  /api/v1/canchas/{id}
  deleteCancha(id)          → DELETE /api/v1/canchas/{id}

  // Horarios
  getHorarios()             → GET  /api/v1/horarios
  getHorariosByCancha(id)   → GET  /api/v1/horarios?idCancha={id}
  createHorario(data)       → POST /api/v1/horarios
  updateHorario(id, data)   → PUT  /api/v1/horarios/{id}

  // Reservas
  getReservas()             → GET  /api/v1/reservas
  getReservaDetalle(id)     → GET  /api/v1/reservas/detalle/{id}
  createReserva(data)       → POST /api/v1/reservas
  updateReserva(id, data)   → PUT  /api/v1/reservas/{id}

  // Pagos
  getPagos()                → GET  /api/v1/pagos
  createPago(data)          → POST /api/v1/pagos
  getPagoById(id)           → GET  /api/v1/pagos/{id}
}
```

## 6. Flujo de login

```
1. Usuario ingresa username/password en LoginComponent
2. KeycloakService.login() → POST /realms/reservas/protocol/openid-connect/token
   (Resource Owner Password Credentials Grant)
3. Keycloak devuelve { access_token, refresh_token }
4. Sesión guardada en localStorage (clave: reservas_auth_session)
5. Router navega a /admin, /dueno o /cliente según el rol
```

```typescript
// Ejemplo de uso en LoginComponent
async login(username: string, password: string) {
  const session = await this.keycloakService.login(username, password);
  const role = session.role;
  this.router.navigate([`/${role.toLowerCase()}/dashboard`]);
}
```

## 7. Flujo de pago del cliente

`ReservaPagoService` orquesta el proceso completo:

```
1. Cliente selecciona horario disponible
   → POST /api/v1/reservas  { idCancha, idHorario, fechaReserva }
   → Reserva creada con estado PENDIENTE
   
2. Kafka (automático, en background):
   → pago-ms recibe el evento y crea pago con metodoPago=KAFKA
   
3. Cliente va a /pago/:reservaId y selecciona método manual
   → POST /api/v1/pagos  { idReserva, monto, metodoPago: "YAPE" }
   → PUT  /api/v1/reservas/{id}  { estado: "CONFIRMADA" }
   → PUT  /api/v1/horarios/{id}  { disponible: false }
   
4. Cliente ve comprobante en /comprobante/:pagoId
```

## 8. Levantar el frontend

```powershell
cd frontend
npm install
ng serve
```

Acceder: http://localhost:4200

### Cuentas de prueba (login en el frontend)

| Usuario | Contraseña | Rol | Ruta destino |
|---------|-----------|-----|-------------|
| admin | admin123 | ADMIN | /admin/dashboard |
| user | user123 | USER/CLIENTE | /cliente/inicio |

> Para probar el rol DUENO: registrarse en `/registro/keycloak` y usar el flujo de registro de dueño.

## 9. Verificación de integración end-to-end

```
1. Levantar toda la infraestructura (ver LEVANTAR-DEV.md)
2. cd frontend && ng serve
3. Abrir http://localhost:4200
4. Login con admin/admin123 → debe navegar a /admin/dashboard
5. Crear una cancha desde /admin/canchas
6. Crear un horario desde /admin (o via API)
7. Login con user/user123 → explorar /cliente/canchas
8. Reservar una cancha → verificar estado PENDIENTE
9. Ir a /cliente/pago/:id → pagar → verificar CONFIRMADA
10. Ir a /cliente/comprobante/:pagoId → ver comprobante
```

## 10. Errores comunes de integración

| Error | Causa | Solución |
|-------|-------|----------|
| `CORS error` | Gateway no permite el origen | Verificar que `localhost:4200` está en la config CORS del Gateway |
| `401 en todas las peticiones` | Token no adjuntado | Verificar `AuthInterceptor` en `app.config.ts` |
| `Cannot read role` | Sesión expirada | Implementar `refresh_token` grant (el servicio lo hace automáticamente) |
| `Keycloak 404` | Realm no importado | Levantar `keycloak/compose-dev.yml` e importar `realm-export.json` |
| `ng serve` falla | Dependencias no instaladas | `npm install` en la carpeta `frontend/` |
