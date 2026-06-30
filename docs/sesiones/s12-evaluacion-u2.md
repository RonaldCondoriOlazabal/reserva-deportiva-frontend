# S12 - Evaluación Unidad 2

## 1. Propósito

Validar que el sistema distribuido es robusto: comunicación síncrona con resiliencia, seguridad multicapa, mensajería asíncrona, consistencia distribuida y observabilidad completa funcionando de extremo a extremo.

## 2. Resultado de aprendizaje

El equipo demuestra que puede operar, defender y diagnosticar el sistema de reservas deportivas bajo condiciones de falla parcial, con múltiples instancias y visibilidad total del estado del sistema.

## 3. Producto de sesión

Sistema corriendo con:
- Comunicación Feign entre `reservas-ms` ↔ `canchas-ms` / `horarios-ms`
- Circuit Breaker activo y verificable con fallback
- Seguridad JWT en Gateway con roles diferenciados
- Keycloak operativo con realm `reservas`
- Kafka con topics `reserva-eventos` y `pago-eventos`
- 2 instancias de `reservas-ms` con balanceo round-robin
- Stack de observabilidad (Grafana + Prometheus + Loki) con métricas reales

## 4. Checklist de evaluación U2

### Comunicación síncrona (Feign + Resilience4j)
- [ ] `GET /api/v1/reservas/detalle/{id}` retorna datos de cancha + horario enriquecidos
- [ ] Con `horarios-ms` apagado: respuesta degradada (fallback), no error 500
- [ ] Con `canchas-ms` apagado: respuesta degradada (fallback), no error 500
- [ ] Estado del circuit breaker visible en actuator: `/actuator/circuitbreakers`

### Seguridad distribuida
- [ ] JWT válido permite acceso a endpoints protegidos
- [ ] JWT expirado o inválido retorna `401`
- [ ] `CLIENTE` no puede crear canchas (`403`)
- [ ] `ADMIN` puede gestionar canchas, horarios y usuarios
- [ ] Keycloak UI accesible en `http://localhost:18080`
- [ ] Login vía Keycloak (OIDC) retorna `access_token`

### Mensajería asíncrona (Kafka)
- [ ] Kafka UI accesible en `http://localhost:41085`
- [ ] Topic `reserva-eventos` existe y tiene mensajes tras crear reserva
- [ ] `POST /api/v1/reservas` genera automáticamente un pago en `pago-ms`
- [ ] `pago-ms` consume el evento y crea registro con `metodoPago=KAFKA`

### Balanceo de carga
- [ ] 2 instancias de `reservas-ms` registradas en Eureka
- [ ] `GET /api/v1/reserva/instancia` alterna entre puerto 9084 y 9184
- [ ] Al apagar una instancia, el tráfico se redirige a la otra automáticamente

### Observabilidad
- [ ] Grafana dashboard muestra métricas de los 5 microservicios
- [ ] Prometheus scraping activo: `http://localhost:19090/targets`
- [ ] Loki muestra logs con `correlationId` trazable entre servicios
- [ ] Al menos una alerta configurada visible en Prometheus

## 5. Comandos de verificación rápida

```powershell
# 1. Detalle enriquecido con Feign
$TOKEN = (curl -s -X POST http://localhost:7091/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}' | ConvertFrom-Json).accessToken

curl http://localhost:7091/api/v1/reservas/detalle/1 `
  -H "Authorization: Bearer $TOKEN"

# 2. Probar circuit breaker: apagar horarios-ms y repetir
# Detener horarios-ms y volver a llamar el endpoint de detalle
# Debe responder con datos degradados, no 500

# 3. Crear reserva y verificar evento Kafka
curl -X POST http://localhost:7091/api/v1/reservas `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"idUsuario":2,"idCancha":1,"idHorario":1,"fechaReserva":"2026-07-01","estado":"PENDIENTE"}'

# Verificar pago creado automáticamente
curl http://localhost:7091/api/v1/pagos `
  -H "Authorization: Bearer $TOKEN"

# 4. Balanceo de carga
curl http://localhost:7091/api/v1/reserva/instancia -H "Authorization: Bearer $TOKEN"
# Repetir varias veces: debe alternar entre 9084 y 9184

# 5. Verificar circuit breakers
curl http://localhost:9084/actuator/circuitbreakers
```

## 6. Flujo completo de reserva + pago (demostración)

```
1. POST /auth/login                    → obtener JWT
2. POST /api/v1/reservas               → crear reserva (estado: PENDIENTE)
   └─→ Kafka: publica en reserva-eventos
       └─→ pago-ms: crea pago automático (metodoPago: KAFKA)
3. GET  /api/v1/reservas/detalle/{id}  → ver reserva enriquecida
4. POST /api/v1/pagos                  → confirmar pago manual (metodoPago: YAPE)
5. PUT  /api/v1/reservas/{id}          → actualizar estado a CONFIRMADA
6. PUT  /api/v1/horarios/{id}          → marcar horario como no disponible
```

## 7. Preguntas frecuentes en sustentación

| Pregunta | Respuesta esperada |
|----------|--------------------|
| ¿Qué pasa si `canchas-ms` está caído al crear una reserva de detalle? | El circuit breaker intercepta y retorna un fallback; el servicio no falla en cascada |
| ¿Por qué Kafka y no una llamada HTTP directa entre reservas y pagos? | Desacoplamiento temporal: reservas-ms no espera que pago-ms responda; si pago-ms cae, el evento se procesa cuando vuelva |
| ¿Cómo sabe Keycloak qué rol asignar al usuario? | El realm `reservas` mapea los claims del token con el rol del usuario registrado |
| ¿Qué almacena Loki? | Los logs de texto de cada microservicio, indexados por etiquetas como `service=reservas` |
| ¿Cómo funciona el balanceo? | El Gateway usa `lb://RESERVAS-MS`, Eureka devuelve las instancias activas y Spring Cloud LoadBalancer aplica round-robin |
| ¿Qué pasa con el correlationId? | `CorrelationIdFilter` genera un UUID por petición; se propaga en headers entre servicios para trazar logs end-to-end |
