# S09 - Consistencia Distribuida

## 1. Propósito

Entender y demostrar los desafíos de mantener la consistencia de datos entre microservicios sin transacciones distribuidas, aplicando el patrón **Saga** a través de eventos Kafka y el patrón **Database-per-Service**.

## 2. El problema de consistencia en microservicios

En un sistema monolítico, una transacción garantiza que todos los cambios ocurren o ninguno. En microservicios, esto no es posible con transacciones ACID distribuidas. En el sistema de reservas:

```
Crear reserva exitosa requiere:
1. reservas-ms → guardar Reserva (estado: PENDIENTE)
2. pago-ms     → crear Pago (APROBADO/RECHAZADO)
3. horarios-ms → marcar horario como no disponible (si pago aprobado)

¿Qué pasa si el paso 2 falla después del paso 1?
```

## 3. Patrón Saga — Coreografía

El proyecto implementa la Saga por **coreografía** (sin orquestador central): cada servicio reacciona a eventos y emite los suyos propios.

```
reservas-ms
    │  crea Reserva (PENDIENTE)
    │  publica ──▶ "reserva.creada" en topic reserva-eventos
    │
    ▼
pago-ms
    │  consume "reserva.creada"
    │  crea Pago (APROBADO o RECHAZADO)
    │  publica ──▶ "pago.aprobado" / "pago.rechazado" en topic pago-eventos
    │
    ▼
[futuro] reservas-ms / horarios-ms
    │  consume "pago.aprobado"
    │  actualiza Reserva a CONFIRMADA
    │  marca Horario como no disponible
```

### Estados de la Reserva (máquina de estados)

```
        PENDIENTE
           │
    ┌──────┴──────┐
    │             │
pago.aprobado  pago.rechazado
    │             │
    ▼             ▼
CONFIRMADA    CANCELADA
```

## 4. Consistencia eventual en la práctica

Cuando el cliente crea una reserva:

1. La respuesta inmediata es `201 Created` con estado `PENDIENTE`
2. El pago se procesa de forma asíncrona (Kafka)
3. Después de milisegundos/segundos, el estado puede cambiar a `CONFIRMADA` o `CANCELADA`

```powershell
# Crear reserva
$TOKEN = (curl -s -X POST http://localhost:7091/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"user","password":"user123"}' | ConvertFrom-Json).accessToken

curl -X POST http://localhost:7091/api/v1/reservas `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "idUsuario": 2,
    "idCancha": 1,
    "idHorario": 1,
    "fechaReserva": "2026-07-01",
    "estado": "PENDIENTE"
  }'
# Respuesta inmediata: {"id":1, "estado":"PENDIENTE", ...}

# Esperar ~1 segundo y consultar el pago generado
curl http://localhost:7091/api/v1/pagos `
  -H "Authorization: Bearer $TOKEN"
# El pago con idReserva=1, metodoPago="KAFKA" debería existir
```

## 5. Patrón Database-per-Service

Cada microservicio tiene su propia base de datos, sin JOINs entre bases:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  db_reservas│    │  db_pagos   │    │  db_canchas │
│             │    │             │    │             │
│  reservas   │    │  pagos      │    │  canchas    │
│  ──────────│    │  ──────────│    │  ──────────│
│  id         │    │  id         │    │  id         │
│  idCancha ──┼───X│  idReserva ─┼───X│  nombre    │
│  idHorario  │    │  monto      │    │  tipo       │
│  estado     │    │  estado     │    │  activa     │
└─────────────┘    └─────────────┘    └─────────────┘
     ← solo BIGINT, sin FK real →
```

La integridad referencial es responsabilidad de la aplicación, no de la base de datos.

## 6. Compensación de transacciones

Si el pago es `RECHAZADO`, el sistema compensa la saga:

```
pago-ms publica "pago.rechazado"
    │
    ▼ (implementación frontend / futura en MS)
reservas-ms actualiza estado a CANCELADA
horarios-ms mantiene el horario disponible (no se marcó)
```

## 7. Idempotencia en el consumidor Kafka

`pago-ms` verifica el tipo de evento antes de procesar, para ignorar eventos que no le corresponden:

```java
if (evento == null || !"reserva.creada".equals(evento.getTipoEvento())) {
    log.warn("Evento ignorado: {}", evento != null ? evento.getTipoEvento() : null);
    return;  // idempotente: no falla, solo ignora
}
```

## 8. Verificar consistencia

```powershell
# 1. Crear varias reservas
# 2. Verificar que cada reserva tiene exactamente un pago en db_pago

# Ver pagos generados automáticamente
curl http://localhost:7091/api/v1/pagos -H "Authorization: Bearer $TOKEN"

# Verificar en Kafka UI: http://localhost:41085
# Consumer Groups → pago-ms-group → lag debería ser 0
# (todos los mensajes fueron consumidos)
```

## 9. Monitoreo de consistencia en Grafana

```promql
# Reservas creadas vs pagos procesados (deberían ser iguales eventualmente)
sum(increase(http_server_requests_seconds_count{
  job="reservas-dev", uri="/api/v1/reservas", method="POST", status="201"
}[5m]))

# Latencia del procesamiento asíncrono (latencyMs en logs de pago-ms)
# Buscar en Loki:
# {service="pago"} |= "latencyMs="
```
