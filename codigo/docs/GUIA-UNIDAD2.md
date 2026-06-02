# Guia de entrega - Unidad 2 (2026-1)

Proyecto de reservas deportivas: auth-ms, canchas-ms, horarios-ms, reservas-ms, pago-ms.

## Requisitos previos

- Docker Desktop, Java 17, Maven
- Red Docker (opcional): `docker network create ms-net`

## 1. Levantar infraestructura

```bash
# Terminal 1
cd infra/config-server && mvn spring-boot:run

# Terminal 2
cd infra/registry-server && mvn spring-boot:run

# Terminal 3
cd infra/gateway && mvn spring-boot:run
```

| Componente | URL |
|------------|-----|
| Config Server | http://localhost:7071 |
| Eureka | http://localhost:7081 |
| Gateway | http://localhost:7091 |

Prod con Docker: `cd infra && docker compose up -d`

## 2. PostgreSQL 16 (bases de datos)

Cada microservicio tiene su propia BD en PostgreSQL:

| Servicio (Eureka) | Carpeta | compose-dev | Puerto PG | BD |
|-------------------|---------|-------------|-----------|-----|
| auth-ms | `auth/` | `auth/compose-dev.yml` | 5431 | db_auth |
| canchas-ms | `canchas/` | `canchas/compose-dev.yml` | 5432 | db_canchas |
| horarios-ms | `horarios/` | `horarios/compose-dev.yml` | 5433 | db_horarios |
| reservas-ms | `reservas/` | `reservas/compose-dev.yml` | 5434 | db_reservas |
| pago-ms | `pago/` | `pago/compose-dev.yml` | 5435 | db_pago |

Credenciales: `reservas` / `reservas`

```bash
cd auth && docker compose -f compose-dev.yml up -d
cd canchas && docker compose -f compose-dev.yml up -d
# ... repetir para horarios, reservas, pago
```

Luego levantar cada microservicio: `mvn spring-boot:run`

| Servicio | Puerto app |
|----------|------------|
| auth | 9081 |
| canchas | 9082 |
| horarios | 9083 |
| reservas | 9084 |
| pago | 9085 |

> Si migras desde MySQL, elimina los volumenes Docker antiguos (`mysql_*`) y levanta los nuevos contenedores Postgres.

## 3. Seguridad (JWT + CORS + roles)

### Login

```bash
curl -X POST http://localhost:7091/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

Usuarios de prueba:

| Usuario | Password | Rol |
|---------|----------|-----|
| admin | admin123 | ADMIN |
| user | user123 | USER |

### Politicas en Gateway

| Recurso | GET | POST/PUT/DELETE |
|---------|-----|-----------------|
| /api/v1/canchas | Publico | ADMIN |
| /api/v1/horarios | Publico | ADMIN |
| /api/v1/usuarios | ADMIN | ADMIN |
| /api/v1/reservas | Autenticado | USER o ADMIN |
| /api/v1/pagos | - | USER o ADMIN |

CORS: `localhost:4200` y `localhost:4300`

## 4. Resiliencia y balanceo

### Circuit Breaker (reservas)

```bash
curl http://localhost:7091/api/v1/reservas/detalle/1 -H "Authorization: Bearer TOKEN"
```

Apagar `horarios` y repetir: debe responder degradado.

### Multiples instancias

```bash
# Instancia 1
cd reservas && mvn spring-boot:run

# Instancia 2 (otro puerto)
cd reservas && mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=9184
```

Probar balanceo:

```bash
curl http://localhost:7091/api/v1/reserva/instancia
```

## 5. Observabilidad

```bash
cd observability
docker compose -f compose-dev.yml up -d
```

- **Grafana**: http://localhost:13000 → Dashboard `Microservicios - Reservas Deportivas`
- **Prometheus**: http://localhost:19090 → Alertas en `/alerts`
- **Loki**: logs por servicio

Consultas utiles:

```promql
up{job=~".*-dev"}
sum by (job) (rate(http_server_requests_seconds_count[1m]))
```

```logql
{service="reservas"} |= "traceId="
```

## 6. Checklist sustentacion

- [ ] Login JWT por Gateway
- [ ] USER recibe 403 al crear cancha
- [ ] ADMIN crea cancha correctamente
- [ ] 2 instancias reservas + balanceo en /instancia
- [ ] Circuit breaker con horarios caido
- [ ] Dashboard Grafana con metricas de 5 servicios
- [ ] Alertas visibles en Prometheus
- [ ] PostgreSQL 16 (no MySQL)
