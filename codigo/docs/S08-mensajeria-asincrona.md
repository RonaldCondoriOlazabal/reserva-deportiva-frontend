# S08 - Mensajería Asíncrona

## 1. Propósito

Desacoplar la creación de reservas del procesamiento de pagos mediante **Apache Kafka**, permitiendo que `reservas-ms` y `pago-ms` operen de forma independiente y tolerante a fallos.

## 2. El problema: acoplamiento síncrono en pagos

Sin mensajería asíncrona, al crear una reserva tendríamos que esperar la respuesta del servicio de pagos de forma síncrona. Si `pago-ms` está caído, la reserva no podría crearse. Kafka resuelve esto:

```
ANTES (acoplado):
reservas-ms ──[HTTP síncrono]──▶ pago-ms
                                   ↓ si cae: error en reserva

AHORA (desacoplado):
reservas-ms ──[Kafka event]──▶ topic "reserva-eventos"
                                         ↓ (async)
                                   pago-ms (cuando esté disponible)
```

## 3. Infraestructura Kafka

```yaml
# kafka/compose-dev.yml
kafka:
  image: apache/kafka:latest
  mode: KRaft (sin ZooKeeper)
  
Bootstrap: localhost:41092
Kafka UI:  http://localhost:41085
Kafka Exporter (métricas): http://localhost:41308/metrics
```

Levantar:
```powershell
cd kafka
docker compose -f compose-dev.yml up -d
```

## 4. Topics configurados

| Topic | Productor | Consumidor | Propósito |
|-------|-----------|-----------|-----------|
| `reserva-eventos` | `reservas-ms` | `pago-ms` | Notifica nueva reserva creada |
| `pago-eventos` | `pago-ms` | (futuro) | Notifica resultado del pago |

## 5. Productor — reservas-ms

Cuando se crea una reserva exitosamente, `reservas-ms` publica un evento en Kafka:

```java
// ReservaServiceImpl.java
@Transactional
public ReservaResponse create(ReservaRequest request) {
    Reserva reserva = repository.save(mapper.toEntity(request));

    EventoReserva evento = EventoReserva.builder()
            .tipoEvento("reserva.creada")
            .reservaId(reserva.getId())
            .idUsuario(reserva.getIdUsuario())
            .idCancha(reserva.getIdCancha())
            .idHorario(reserva.getIdHorario())
            .monto(new BigDecimal("50.00"))
            .estado(reserva.getEstado())
            .origen("reservas-ms")
            .timestamp(Instant.now().toEpochMilli())
            .build();

    reservaProducer.publicarReservaCreada(evento);
    return mapper.toResponse(reserva);
}
```

### Estructura del evento `reserva.creada`

```json
{
  "tipoEvento": "reserva.creada",
  "reservaId": 1,
  "idUsuario": 2,
  "idCancha": 1,
  "idHorario": 3,
  "monto": 50.00,
  "estado": "PENDIENTE",
  "origen": "reservas-ms",
  "timestamp": 1750000000000
}
```

## 6. Consumidor — pago-ms

`pago-ms` escucha el topic `reserva-eventos` y procesa cada evento de forma automática:

```java
// ReservaConsumer.java
@KafkaListener(
    topics = "${app.kafka.topic.reservas}",      // "reserva-eventos"
    groupId = "${app.kafka.group-id.pagos}",     // "pago-ms-group"
    containerFactory = "kafkaListenerContainerFactory"
)
public void consumirEventoReserva(EventoReserva evento) {
    // Solo procesa eventos de tipo "reserva.creada"
    if (!"reserva.creada".equals(evento.getTipoEvento())) return;

    // Simula aprobación con 70% de probabilidad
    boolean aprobado = Math.random() > 0.3;
    String estado = aprobado ? "APROBADO" : "RECHAZADO";

    Pago pago = Pago.builder()
            .idReserva(evento.getReservaId())
            .monto(evento.getMonto())
            .metodoPago("KAFKA")
            .estado(estado)
            .fechaPago(LocalDate.now().toString())
            .referencia("PAY-" + evento.getReservaId())
            .build();

    pagoRepository.save(pago);

    // Publica resultado en "pago-eventos"
    pagoProducer.publicarEventoPago(EventoPago.builder()
            .tipoEvento(aprobado ? "pago.aprobado" : "pago.rechazado")
            .reservaId(evento.getReservaId())
            .monto(evento.getMonto())
            .estado(estado)
            .origen("pago-ms")
            .timestamp(Instant.now().toEpochMilli())
            .build());
}
```

## 7. Flujo completo de una reserva

```
1. Cliente POST /api/v1/reservas
        │
        ▼
2. reservas-ms guarda Reserva (estado: PENDIENTE)
        │
        ▼
3. reservas-ms publica evento en "reserva-eventos"
        │                              │
        │ (respuesta inmediata)        ▼ (asíncrono)
4. Cliente recibe 201 Created    pago-ms consume evento
                                       │
                                       ▼
                              5. pago-ms crea Pago (APROBADO/RECHAZADO)
                                       │
                                       ▼
                              6. pago-ms publica en "pago-eventos"
```

## 8. Monitoreo en Kafka UI

Acceder a `http://localhost:41085` para:

- **Topics** → ver mensajes en `reserva-eventos` y `pago-eventos`
- **Consumer Groups** → ver el lag del grupo `pago-ms-group`
- **Brokers** → estado del broker KRaft

### Ver mensajes desde CLI

```powershell
# Listar topics
docker exec reservas-kafka-dev /opt/kafka/bin/kafka-topics.sh `
  --bootstrap-server localhost:9092 --list

# Consumir mensajes de reserva-eventos
docker exec reservas-kafka-dev /opt/kafka/bin/kafka-console-consumer.sh `
  --bootstrap-server localhost:9092 `
  --topic reserva-eventos `
  --from-beginning
```

## 9. Diferencia entre pagos REST vs Kafka

| Característica | REST directo | Kafka (automático) |
|---------------|-------------|-------------------|
| `metodoPago` en BD | `YAPE`, `PLIN`, `TARJETA` | `KAFKA` |
| Quién inicia | El cliente via frontend | Automático al crear reserva |
| Visible en frontend | Sí (historial) | Filtrado (no mostrado al usuario) |
| Propósito | Pago real del usuario | Demostración de mensajería async |

## 10. Métricas Kafka en Prometheus

```promql
# Mensajes producidos por segundo
kafka_server_brokertopicmetrics_messagesin_total{topic="reserva-eventos"}

# Lag del consumer group de pagos
kafka_consumer_group_lag{group="pago-ms-group"}
```
