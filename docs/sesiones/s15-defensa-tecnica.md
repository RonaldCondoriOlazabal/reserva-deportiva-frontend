# S15 - Defensa Técnica

## 1. Propósito

Demostrar en vivo la capacidad de operar, diagnosticar y defender el sistema de reservas deportivas ante preguntas técnicas del docente, con el sistema funcionando en tiempo real.

## 2. Resultado de aprendizaje

El estudiante puede operar el sistema bajo condiciones controladas: simular fallas, interpretar métricas, trazar peticiones y explicar cada decisión de arquitectura con evidencia en código.

## 3. Producto de sesión

Demostración en vivo con evidencia técnica individual de:
- Sistema corriendo y observable
- Flujo completo ejecutable en menos de 3 minutos
- Capacidad de diagnosticar un fallo inducido
- Justificación de al menos 3 decisiones de diseño

## 4. Guía de demostración (5 minutos)

### Minuto 1 — Estado del sistema

```powershell
# Mostrar todos los servicios activos
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Eureka: 5 servicios registrados
Start-Process "http://localhost:7081"

# Grafana: dashboard con métricas
Start-Process "http://localhost:13000"
```

### Minuto 2 — Flujo completo de reserva

```powershell
# Login
$RES = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:7091/auth/login" `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin123"}'
$TOKEN = $RES.accessToken

# Crear reserva
$RESERVA = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:7091/api/v1/reservas" `
  -Headers @{Authorization="Bearer $TOKEN"; "Content-Type"="application/json"} `
  -Body '{"idUsuario":2,"idCancha":1,"idHorario":1,"fechaReserva":"2026-07-15","estado":"PENDIENTE"}'

Write-Host "Reserva creada ID:" $RESERVA.id

# Verificar pago automático generado por Kafka
Start-Sleep -Seconds 2
Invoke-RestMethod "http://localhost:7091/api/v1/pagos" `
  -Headers @{Authorization="Bearer $TOKEN"} | Format-Table
```

### Minuto 3 — Resilencia: apagar un servicio

```powershell
# Detener horarios-ms (simular falla)
# Ctrl+C en la terminal de horarios-ms

# Solicitar detalle de reserva (debe retornar fallback, no 500)
Invoke-RestMethod "http://localhost:7091/api/v1/reservas/detalle/1" `
  -Headers @{Authorization="Bearer $TOKEN"}

# Ver estado del circuit breaker
Invoke-RestMethod "http://localhost:9084/actuator/circuitbreakers"
# Estado: OPEN para horarios-ms
```

### Minuto 4 — Trazabilidad

```
1. Abrir Grafana: http://localhost:13000
2. Dashboard: "Microservicios - Reservas Deportivas"
   → Mostrar RPS, latencia, errores de los 5 servicios
3. Explore → Loki → query: {service="reservas"} |= "correlationId"
   → Identificar el correlationId de la última petición
   → Buscar el mismo ID en logs de pago-ms
```

### Minuto 5 — Balanceo de carga

```powershell
# Abrir segunda terminal con segunda instancia
# cd reservas && mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=9184

# Probar balanceo
1..6 | ForEach-Object {
  (Invoke-RestMethod "http://localhost:7091/api/v1/reserva/instancia" `
    -Headers @{Authorization="Bearer $TOKEN"}).puerto
}
# Resultado esperado: 9084, 9184, 9084, 9184, 9084, 9184
```

## 5. Preguntas frecuentes del docente

### Arquitectura

| Pregunta | Respuesta |
|----------|-----------|
| ¿Por qué microservicios y no un monolito? | Cada dominio (canchas, reservas, pagos) escala y se despliega independientemente. Si los pagos tienen alta carga, escalamos solo `pago-ms` |
| ¿Cómo manejan transacciones distribuidas? | No usamos 2PC. Kafka garantiza entrega del evento; si `pago-ms` falla, el mensaje queda en el topic y se reprocesa cuando vuelva |
| ¿Por qué PostgreSQL y no MySQL? | PostgreSQL soporta mejor JSON, arrays y tiene MVCC más eficiente. Spring Boot 3.x tiene mejor integración con su driver |

### Seguridad

| Pregunta | Respuesta |
|----------|-----------|
| ¿Dónde se valida el JWT? | En el Gateway, antes de enrutar. Los microservicios no tienen Spring Security para JWT; confían en que el Gateway ya validó |
| ¿Por qué Keycloak además de JWT propio? | Auth-ms maneja cuentas admin/cliente con JWT simple. Keycloak maneja el flujo OAuth2 de registro de dueños con su propio realm |
| ¿Qué pasa si roban el JWT? | El token expira (tiempo configurado en `JwtProperties`). Mitigación adicional: implementar lista negra de tokens o usar refresh token rotation |

### Kafka

| Pregunta | Respuesta |
|----------|-----------|
| ¿Qué pasa si `pago-ms` está caído cuando se crea una reserva? | Kafka retiene el mensaje en el topic. Cuando `pago-ms` reinicia, consume todos los eventos pendientes desde su último offset |
| ¿Por qué KRaft y no ZooKeeper? | Kafka 4.x elimina ZooKeeper. KRaft es el modo nativo, reduce la complejidad operacional (un componente menos) |
| ¿Qué garantías de entrega usan? | `at-least-once`: el producer confirma cuando el broker recibió el mensaje. El consumer comitea el offset tras procesar |

### Observabilidad

| Pregunta | Respuesta |
|----------|-----------|
| ¿Qué métrica usarías para detectar un problema en producción? | `http_server_requests_seconds_count` filtrado por `status=5xx` + alerta en Prometheus si supera un umbral en 1 minuto |
| ¿Cómo correlacionas logs entre servicios? | El `CorrelationIdFilter` genera un UUID por petición que se incluye en todos los logs via MDC. Se busca el mismo UUID en Loki |
| ¿Qué alertas tienes configuradas? | `ServicioCaido` (up=0), `AltaTasaErrores5xx` (>5% de requests con 500), `CircuitBreakerAbierto` |

## 6. Checklist de defensa

- [ ] Sistema completo corriendo al iniciar la sesión
- [ ] Dashboard Grafana con datos reales (no vacío)
- [ ] Flujo de reserva ejecutado en vivo (< 3 min)
- [ ] Falla inducida → fallback demostrado
- [ ] Balanceo de carga demostrado con 2 instancias
- [ ] Al menos 3 preguntas de arquitectura respondidas con evidencia en código
- [ ] correlationId trazado en Loki de principio a fin
