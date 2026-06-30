# S04 - Acceso Único y Tráfico

## 1. Propósito

Implementar un punto de entrada único al sistema mediante **Spring Cloud Gateway** que centralice el enrutamiento, la autenticación JWT, las políticas de acceso por rol y la configuración CORS.

## 2. Arquitectura del Gateway

```
Browser / Frontend (4200)
        │
        │  HTTP + Authorization: Bearer <token>
        ▼
┌──────────────────────────────────────────────┐
│            API Gateway  :7091 / :7092         │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ JWT      │  │ CORS     │  │ Rate      │  │
│  │ Filter   │  │ Filter   │  │ Limiter   │  │
│  └──────────┘  └──────────┘  └───────────┘  │
│                                              │
│         Spring Cloud LoadBalancer            │
└──────────────────────────────────────────────┘
        │
        ├──▶ lb://AUTH-MS       :9081
        ├──▶ lb://CANCHAS-MS    :9082
        ├──▶ lb://HORARIOS-MS   :9083
        ├──▶ lb://RESERVAS-MS   :9084 / :9184
        └──▶ lb://PAGO-MS       :9085
```

## 3. Rutas configuradas

| ID de ruta | Path de entrada | Servicio destino |
|------------|-----------------|-----------------|
| `auth-ms` | `/auth/**`, `/api/v1/usuarios/**` | `lb://AUTH-MS` |
| `canchas-ms` | `/api/v1/canchas/**` | `lb://CANCHAS-MS` |
| `horarios-ms` | `/api/v1/horarios/**` | `lb://HORARIOS-MS` |
| `reservas-ms` | `/api/v1/reservas/**`, `/api/v1/reserva/**` | `lb://RESERVAS-MS` |
| `pago-ms` | `/api/v1/pagos/**` | `lb://PAGO-MS` |

El prefijo `lb://` indica que Spring Cloud LoadBalancer resolverá el nombre consultando Eureka.

## 4. Políticas de seguridad por ruta

| Recurso | GET | POST / PUT / DELETE |
|---------|-----|---------------------|
| `/auth/login` | Público | — |
| `/api/v1/canchas` | **Público** | Solo `ADMIN` |
| `/api/v1/horarios` | **Público** | Solo `ADMIN` |
| `/api/v1/usuarios` | Solo `ADMIN` | Solo `ADMIN` |
| `/api/v1/reservas` | Autenticado | `USER` o `ADMIN` |
| `/api/v1/pagos` | Autenticado | `USER` o `ADMIN` |

## 5. Validación JWT en el Gateway

El Gateway extrae y valida el token en cada petición antes de enrutarla:

```
Petición entrante
      │
      ▼
¿Tiene Authorization: Bearer?
      │
      ├── NO ──▶ 401 Unauthorized  (si la ruta requiere autenticación)
      │
      └── SÍ ──▶ Verificar firma HS256 con jwt.secret
                        │
                        ├── Inválido / expirado ──▶ 401
                        │
                        └── Válido ──▶ Extraer roles del claim
                                              │
                                              └── ¿Tiene el rol requerido?
                                                        │
                                                        ├── NO ──▶ 403 Forbidden
                                                        └── SÍ ──▶ Enrutar al MS
```

## 6. Obtener token de acceso

```powershell
# Login por el Gateway
curl -X POST http://localhost:7091/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}'
```

**Respuesta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "username": "admin",
  "roles": ["ADMIN"]
}
```

## 7. Usuarios de prueba precargados

| Usuario | Contraseña | Rol | Acceso |
|---------|-----------|-----|--------|
| `admin` | `admin123` | `ADMIN` | Gestión total |
| `user` | `user123` | `USER` | Reservas y pagos |

## 8. Configuración CORS

El Gateway permite peticiones desde el frontend Angular:

```yaml
spring:
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins:
              - "http://localhost:4200"
              - "http://localhost:4300"
            allowedMethods: [GET, POST, PUT, DELETE, OPTIONS]
            allowedHeaders: ["*"]
            allowCredentials: true
```

## 9. Pruebas de acceso

```powershell
# Guardar token
$TOKEN = (curl -s -X POST http://localhost:7091/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}' | ConvertFrom-Json).accessToken

# GET público — sin token
curl http://localhost:7091/api/v1/canchas

# GET autenticado — con token
curl http://localhost:7091/api/v1/reservas `
  -H "Authorization: Bearer $TOKEN"

# POST como ADMIN — crear cancha
curl -X POST http://localhost:7091/api/v1/canchas `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"nombre":"Cancha 1","ubicacion":"Pabellón A","tipo":"futbol","activa":true}'

# Verificar que USER no puede crear cancha (403)
$TOKEN_USER = (curl -s -X POST http://localhost:7091/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"user","password":"user123"}' | ConvertFrom-Json).accessToken

curl -X POST http://localhost:7091/api/v1/canchas `
  -H "Authorization: Bearer $TOKEN_USER" `
  -H "Content-Type: application/json" `
  -d '{"nombre":"Cancha 2","ubicacion":"Pabellón B","tipo":"voley","activa":true}'
# Debe retornar 403 Forbidden
```

## 10. Trazabilidad — Correlation ID

Cada microservicio incluye el filtro `CorrelationIdFilter` que propaga un identificador único por cada petición:

```
X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
```

Este ID aparece en todos los logs de todos los servicios que participaron en una misma petición, facilitando el rastreo distribuido en Loki/Grafana.
