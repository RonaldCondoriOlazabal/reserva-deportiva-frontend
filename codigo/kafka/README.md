# Kafka - Reservas Deportivas

Broker Kafka (KRaft) + Kafka UI + exporter para mensajería asíncrona entre `reservas-ms` y `pago-ms`.

## Levantar (DEV)

```powershell
cd kafka
docker compose -f compose-dev.yml up -d
```

| Componente | URL |
|------------|-----|
| Kafka UI | http://localhost:41085 |
| Bootstrap (desde Windows) | localhost:41092 |

## Topics

| Topic | Productor | Consumidor |
|-------|-----------|------------|
| `reserva-eventos` | reservas-ms | pago-ms |
| `pago-eventos` | pago-ms | (observabilidad / futuro) |

Crear manualmente (opcional; auto-create está habilitado):

```powershell
docker exec -it reservas-kafka-dev /opt/kafka/bin/kafka-topics.sh --create --topic reserva-eventos --bootstrap-server kafka:9092 --partitions 1 --replication-factor 1
docker exec -it reservas-kafka-dev /opt/kafka/bin/kafka-topics.sh --create --topic pago-eventos --bootstrap-server kafka:9092 --partitions 1 --replication-factor 1
docker exec -it reservas-kafka-dev /opt/kafka/bin/kafka-topics.sh --list --bootstrap-server kafka:9092
```

## Flujo

1. `POST /api/v1/reservas` → reservas-ms guarda y publica `reserva.creada`
2. pago-ms consume el evento y crea el pago automáticamente
3. pago-ms publica `pago.aprobado` o `pago.rechazado` en `pago-eventos`

## Probar

```powershell
# Crear reserva (con token JWT)
curl.exe -X POST http://localhost:7091/api/v1/reservas -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d "{\"idUsuario\":2,\"idCancha\":1,\"idHorario\":1,\"fechaReserva\":\"2026-06-01\",\"estado\":\"PENDIENTE\"}"

# Ver pagos generados
curl.exe http://localhost:7091/api/v1/pagos -H "Authorization: Bearer TOKEN"
```

Revisar mensajes en Kafka UI → Topics → `reserva-eventos` / `pago-eventos`.
