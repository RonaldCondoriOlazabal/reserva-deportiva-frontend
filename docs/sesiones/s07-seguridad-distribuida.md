# S07 - Seguridad Distribuida

## 1. Propósito

Implementar una estrategia de seguridad en capas que combina **JWT personalizado** (para el backend/gateway) y **Keycloak OIDC** (para el frontend), con control de acceso basado en roles en todos los niveles del sistema.

## 2. Arquitectura de seguridad dual

El proyecto usa dos mecanismos de autenticación complementarios:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Angular                         │
│                                                             │
│  Keycloak OIDC (18080)  ←──── login / registro              │
│  Token Keycloak ──────────────────────────┐                 │
└───────────────────────────────────────────┼─────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway :7091                         │
│                                                             │
│  Valida JWT (HS256)  ←── token de auth-ms O Keycloak        │
│  Extrae roles del claim                                     │
│  Aplica políticas por ruta                                  │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
    auth-ms :9081                   Microservicios
    (emite JWT HS256)               (confían en el Gateway)
```

## 3. Estrategia A — JWT personalizado (backend)

### Flujo de autenticación

```
Cliente ──POST /auth/login──▶ Gateway ──▶ auth-ms
                                              │
                              ◀── JWT token ──┘
                              
[peticiones siguientes]
Cliente ──GET /api/v1/reservas──▶ Gateway (valida JWT) ──▶ reservas-ms
```

### Estructura del JWT

```json
{
  "sub": "admin",
  "preferred_username": "admin",
  "roles": ["ADMIN"],
  "iss": "reservas-deportivas",
  "iat": 1750000000,
  "exp": 1750086400
}
```

### Configuración de seguridad en auth-ms

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/auth/login",
                    "/actuator/health",
                    "/actuator/prometheus",
                    "/v3/api-docs/**",
                    "/swagger-ui/**"
                ).permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

## 4. Estrategia B — Keycloak OIDC (frontend)

### Realm y configuración

| Parámetro | Valor |
|-----------|-------|
| Keycloak URL | `http://localhost:18080` |
| Realm | `reservas` |
| Client ID | `frontend` |
| Client Type | Public (sin secret) |
| Flujos habilitados | Password Grant + Authorization Code |

### Roles en Keycloak

| Rol | Acceso |
|-----|--------|
| `ADMIN` | Gestión total: canchas, horarios, usuarios, reservas, pagos |
| `DUENO` | Gestión de sus canchas, horarios y visualización de reservas |
| `CLIENTE` | Explorar canchas, crear reservas, pagar |

### Almacenamiento de sesión

```typescript
// KeycloakService — sesión persistida en localStorage
const SESSION_KEY = 'reservas_auth_session';
localStorage.setItem(SESSION_KEY, JSON.stringify({
  accessToken: '...',
  refreshToken: '...',
  role: 'CLIENTE',
  username: 'juan'
}));
```

### Workaround de roles para nuevos registros

Usuarios recién registrados en Keycloak no tienen rol asignado inmediatamente. El frontend usa un override temporal:

```typescript
// Rol asignado durante el proceso de registro
localStorage.setItem('reservas_role_override', 'CLIENTE');
```

> En producción este override debe reemplazarse con una asignación automática de roles en Keycloak post-registro.

## 5. Interceptor HTTP — adjunta token automáticamente

```typescript
// AuthInterceptor — inyecta el token en TODAS las peticiones al Gateway
intercept(req: HttpRequest<any>, next: HttpHandler) {
  const session = this.keycloakService.getSession();
  if (session?.accessToken) {
    req = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${session.accessToken}`
      }
    });
  }
  return next.handle(req);
}
```

## 6. Guards de rutas en el frontend

```typescript
// auth.guard.ts
export const authGuard     = () => !!keycloakService.getSession();
export const adminGuard    = () => keycloakService.hasRole('ADMIN');
export const duenoGuard    = () => keycloakService.hasRole('DUENO');
export const clienteGuard  = () => keycloakService.hasRole('CLIENTE');
```

| Ruta | Guard aplicado |
|------|---------------|
| `/admin/**` | `authGuard` + `adminGuard` |
| `/dueno/**` | `authGuard` + `duenoGuard` |
| `/cliente/**` | `authGuard` + `clienteGuard` |

## 7. Pruebas de seguridad

```powershell
# Verificar que USER no puede crear cancha (403)
$TOKEN_USER = (curl -s -X POST http://localhost:7091/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"user","password":"user123"}' | ConvertFrom-Json).accessToken

curl -s -o /dev/null -w "HTTP Status: %{http_code}" `
  -X POST http://localhost:7091/api/v1/canchas `
  -H "Authorization: Bearer $TOKEN_USER" `
  -H "Content-Type: application/json" `
  -d '{"nombre":"Test","ubicacion":"X","tipo":"futbol","activa":true}'
# Esperado: HTTP Status: 403

# Sin token → 401
curl -s -o /dev/null -w "HTTP Status: %{http_code}" `
  http://localhost:7091/api/v1/reservas
# Esperado: HTTP Status: 401

# ADMIN puede crear cancha
$TOKEN_ADMIN = (curl -s -X POST http://localhost:7091/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}' | ConvertFrom-Json).accessToken

curl -s -o /dev/null -w "HTTP Status: %{http_code}" `
  -X POST http://localhost:7091/api/v1/canchas `
  -H "Authorization: Bearer $TOKEN_ADMIN" `
  -H "Content-Type: application/json" `
  -d '{"nombre":"Cancha 1","ubicacion":"Pabellón A","tipo":"futbol","activa":true}'
# Esperado: HTTP Status: 201
```
