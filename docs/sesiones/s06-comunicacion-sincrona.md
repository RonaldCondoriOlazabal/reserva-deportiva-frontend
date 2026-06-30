# S06 - Comunicación Síncrona Resiliente

## 1. Propósito

Implementar la comunicación síncrona entre microservicios usando **OpenFeign** con descubrimiento dinámico vía Eureka, y protegerla con **Resilience4j Circuit Breaker** para garantizar resiliencia ante fallos.

## 2. El problema: comunicación entre servicios

Cuando el frontend pide el **detalle de una reserva**, `reservas-ms` necesita enriquecer la respuesta con datos de `canchas-ms` y `horarios-ms`. Esta comunicación es síncrona (request-response):

```
Frontend
  │
  ▼
Gateway :7091
  │
  ▼
reservas-ms :9084
  │
  ├──[Feign]──▶ canchas-ms :9082   → nombre, ubicación, tipo
  │
  └──[Feign]──▶ horarios-ms :9083  → fecha, hora inicio, hora fin
```

## 3. OpenFeign — clientes declarativos

`reservas-ms` define dos clientes Feign para consumir los otros servicios:

```java
// CanchasClient.java
@FeignClient(name = "canchas-ms")   // nombre en Eureka
public interface CanchasClient {
    @GetMapping("/api/v1/canchas/{id}")
    CanchaDto findCanchaById(@PathVariable Long id);
}

// HorariosClient.java
@FeignClient(name = "horarios-ms")  // nombre en Eureka
public interface HorariosClient {
    @GetMapping("/api/v1/horarios/{id}")
    HorarioDto findHorarioById(@PathVariable Long id);
}
```

No se hardcodea ninguna URL; Feign consulta Eureka dinámicamente.

## 4. Endpoint de detalle enriquecido

`GET /api/v1/reservas/detalle/{id}` devuelve la reserva con los objetos cancha y horario anidados:

```json
{
  "id": 1,
  "idUsuario": 2,
  "idCancha": 1,
  "idHorario": 3,
  "fechaReserva": "2026-07-01",
  "estado": "PENDIENTE",
  "cancha": {
    "id": 1,
    "nombre": "Cancha Fútbol 1",
    "ubicacion": "Pabellón A",
    "tipo": "futbol",
    "activa": true
  },
  "horario": {
    "id": 3,
    "idCancha": 1,
    "fecha": "2026-07-01",
    "horaInicio": "08:00",
    "horaFin": "09:00",
    "disponible": true
  }
}
```

## 5. Circuit Breaker con Resilience4j

El endpoint `/detalle/{id}` está protegido con Circuit Breaker. Si `canchas-ms` u `horarios-ms` fallan, el sistema responde en modo degradado en lugar de lanzar un error:

```java
@CircuitBreaker(name = "reservasDetalle", fallbackMethod = "fallbackDetalleReserva")
public ReservaResponse findDetalleById(Long id) {
    // Llama a canchas-ms y horarios-ms via Feign
    ...
}

// Fallback: responde sin datos enriquecidos
public ReservaResponse fallbackDetalleReserva(Long id, Throwable ex) {
    Reserva reserva = getById(id);
    return ReservaResponse.builder()
            .id(reserva.getId())
            .idUsuario(reserva.getIdUsuario())
            .idCancha(reserva.getIdCancha())
            .idHorario(reserva.getIdHorario())
            .fechaReserva(reserva.getFechaReserva())
            .estado(reserva.getEstado())
            .cancha(null)    // degradado: sin datos de cancha
            .horario(null)   // degradado: sin datos de horario
            .build();
}
```

## 6. Estados del Circuit Breaker

```
CLOSED ──[fallas > umbral]──▶ OPEN ──[tiempo de espera]──▶ HALF_OPEN
  ▲                                                              │
  └──────────────────────[éxito]─────────────────────────────────┘
```

| Estado | Comportamiento |
|--------|---------------|
| `CLOSED` | Tráfico normal, monitorea fallos |
| `OPEN` | Rechaza peticiones inmediatamente → fallback |
| `HALF_OPEN` | Permite peticiones de prueba para ver si el servicio se recuperó |

## 7. Demostración

### Escenario normal (todos los servicios activos)

```powershell
$TOKEN = (curl -s -X POST http://localhost:7091/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}' | ConvertFrom-Json).accessToken

# Crear cancha, horario y reserva primero, luego:
curl http://localhost:7091/api/v1/reservas/detalle/1 `
  -H "Authorization: Bearer $TOKEN"
# Respuesta: reserva con cancha y horario anidados
```

### Escenario degradado (horarios-ms caído)

```powershell
# 1. Detener horarios-ms (Ctrl+C en esa terminal)

# 2. Llamar al detalle
curl http://localhost:7091/api/v1/reservas/detalle/1 `
  -H "Authorization: Bearer $TOKEN"
# Respuesta: reserva con cancha=null, horario=null (fallback activo)

# 3. Ver estado del Circuit Breaker en Actuator
curl http://localhost:7091/api/v1/reservas/actuator/circuitbreakers
```

## 8. Métricas del Circuit Breaker en Prometheus

```promql
# Estado actual (0=CLOSED, 1=OPEN, 2=HALF_OPEN)
resilience4j_circuitbreaker_state{name="reservasDetalle"}

# Tasa de fallos
resilience4j_circuitbreaker_failure_rate{name="reservasDetalle"}

# Llamadas al fallback
resilience4j_circuitbreaker_calls_total{name="reservasDetalle", kind="failed"}
```
