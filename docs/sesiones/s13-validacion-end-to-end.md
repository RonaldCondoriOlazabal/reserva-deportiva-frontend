# S13 - Validación End-to-End

## 1. Propósito

Ejecutar el flujo completo del sistema de reservas deportivas desde el frontend Angular hasta cada microservicio, verificando que todas las integraciones funcionan de extremo a extremo sin intervención manual en las APIs.

## 2. Resultado de aprendizaje

El equipo demuestra que el sistema completo es funcional: un usuario puede registrarse, explorar canchas, crear una reserva y completar un pago usando únicamente la interfaz web.

## 3. Producto de sesión

Flujo completo ejecutado en navegador:
- Login (JWT vía Keycloak o auth-ms) → navegación por rol
- Cliente explora canchas → selecciona horario → crea reserva
- Cliente realiza pago → ve comprobante
- Dueño ve reservas de sus canchas en su panel
- Admin gestiona canchas, horarios y solicitudes

## 4. Prerrequisitos

Todo el stack debe estar corriendo antes de iniciar la validación:

```powershell
# Verificar que todos los servicios responden
curl http://localhost:7091/actuator/health    # Gateway
curl http://localhost:7081/actuator/health    # Eureka
curl http://localhost:7071/auth-ms/dev        # Config Server
curl http://localhost:18080                   # Keycloak
curl http://localhost:41085                   # Kafka UI
curl http://localhost:13000                   # Grafana
```

Frontend corriendo:
```powershell
cd frontend
npm install
ng serve
# Acceder: http://localhost:4200
```

## 5. Escenarios de validación

### Escenario 1 — Login y navegación por rol

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 1 | Abrir `http://localhost:4200` | Redirige a `/login` |
| 2 | Login con `admin` / `admin123` | Navega a `/admin/dashboard` |
| 3 | Logout y login con `user` / `user123` | Navega a `/cliente/inicio` |
| 4 | Intentar ir a `/admin` manualmente como CLIENTE | Redirige a `/no-autorizado` |

### Escenario 2 — Admin gestiona canchas y horarios

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 1 | Login como admin → `/admin/canchas` | Lista de canchas visible |
| 2 | Crear cancha nueva (nombre, ubicación, tipo) | Cancha aparece en la lista |
| 3 | Ir a `/admin/solicitudes` | Lista de solicitudes de dueños |
| 4 | Crear horario vía API para la cancha creada | Horario disponible |

```powershell
# Crear horario de prueba
$TOKEN = (curl -s -X POST http://localhost:7091/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}' | ConvertFrom-Json).accessToken

curl -X POST http://localhost:7091/api/v1/horarios `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"idCancha":1,"horaInicio":"08:00","horaFin":"09:00","disponible":true}'
```

### Escenario 3 — Cliente reserva y paga

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 1 | Login como `user/user123` | Panel cliente |
| 2 | Ir a `/cliente/canchas` | Lista de canchas disponibles |
| 3 | Seleccionar una cancha → ver detalle | Horarios disponibles visibles |
| 4 | Reservar un horario | Reserva creada con estado `PENDIENTE` |
| 5 | Ir a `/cliente/mis-reservas` | Reserva aparece en historial |
| 6 | Ir a `/cliente/pago/:reservaId` | Formulario de pago |
| 7 | Seleccionar método (YAPE, BCP, etc.) y confirmar | Pago procesado, estado `CONFIRMADA` |
| 8 | Ir a `/cliente/comprobante/:pagoId` | Comprobante PDF/vista detallada |

### Escenario 4 — Verificar flujo Kafka (background)

Después del paso 4 del Escenario 3:

```powershell
# Verificar que pago-ms creó el pago automáticamente vía Kafka
curl http://localhost:7091/api/v1/pagos `
  -H "Authorization: Bearer $TOKEN"
# Debe existir un pago con metodoPago=KAFKA para la reserva creada

# Verificar mensajes en Kafka UI
# http://localhost:41085 → Topics → reserva-eventos
```

### Escenario 5 — Dueño gestiona sus canchas

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 1 | Registrarse como dueño en `/registro/keycloak` | Cuenta creada en Keycloak |
| 2 | Login con cuenta dueño | Navega a `/dueno/dashboard` |
| 3 | Ir a `/dueno/registrar` | Formulario de nueva cancha |
| 4 | Ir a `/dueno/horarios` | Gestión de horarios |
| 5 | Ir a `/dueno/reservas` | Ver reservas de sus canchas |

## 6. Verificación de trazabilidad

```powershell
# Ver logs con correlationId en Grafana/Loki
# http://localhost:13000 → Explore → Loki

# Query: todos los logs de una reserva específica
{service="reservas"} |= "correlationId"

# Trazar la misma petición en reservas + pago + horarios
{service=~"reservas|pago|horarios"} |= "CORRELATION_ID_AQUI"
```

## 7. Checklist de validación E2E

### Autenticación y autorización
- [ ] Login JWT funciona desde el frontend
- [ ] Login Keycloak (OIDC) redirige y crea sesión correcta
- [ ] Guards de rol redirigen correctamente en la UI
- [ ] Token se adjunta automáticamente en todas las peticiones HTTP

### Flujo de negocio
- [ ] Admin puede crear y eliminar canchas desde la UI
- [ ] Cliente puede explorar canchas disponibles
- [ ] Cliente puede crear reserva seleccionando horario
- [ ] Pago se crea automáticamente vía Kafka (metodoPago=KAFKA)
- [ ] Cliente puede realizar pago manual desde la UI
- [ ] Comprobante de pago accesible
- [ ] Estado de reserva cambia a CONFIRMADA tras pago

### Integración
- [ ] Frontend se comunica exclusivamente a través del Gateway (`:7092`)
- [ ] No hay llamadas directas a microservicios individuales
- [ ] CORS configurado correctamente (sin errores en consola del browser)
- [ ] Interceptor adjunta Bearer token en cada request

## 8. Errores comunes en validación E2E

| Error | Causa probable | Solución |
|-------|---------------|----------|
| CORS error en browser | Gateway no permite `localhost:4200` | Verificar config CORS en `gateway/` |
| 401 en todas las peticiones | AuthInterceptor no activo | Revisar `app.config.ts`, `provideHttpClient(withInterceptors([...]))` |
| Keycloak redirect falla | Realm no importado | Levantar `keycloak/compose-dev.yml` e importar `realm-export.json` |
| Reserva crea pero pago no aparece | Kafka no está corriendo | Levantar `kafka/compose-dev.yml` |
| `Cannot read role` | Sesión localStorage corrupta | Limpiar `localStorage` en DevTools y volver a logear |
| Horarios no aparecen en detalle cancha | `horarios-ms` caído o circuit breaker abierto | Reiniciar `horarios-ms` |
