# Levantar todo en DEV (paso a paso)

Ejecuta cada bloque en orden. Necesitas **Docker Desktop** abierto y **Java 17**.

## Paso 0 - Red Docker (una vez)

```powershell
docker network create ms-net
```

## Paso 1 - Bases de datos PostgreSQL

Abre 5 terminales o ejecuta en secuencia:

```powershell
cd auth      ; docker compose -f compose-dev.yml up -d
cd ..\canchas   ; docker compose -f compose-dev.yml up -d
cd ..\horarios  ; docker compose -f compose-dev.yml up -d
cd ..\reservas  ; docker compose -f compose-dev.yml up -d
cd ..\pago      ; docker compose -f compose-dev.yml up -d
```

Verificar: `docker ps` debe mostrar 5 contenedores `reservas-postgres-*`.

## Paso 2 - Infraestructura (3 terminales)

```powershell
# Terminal A
cd infra\config-server
mvn spring-boot:run

# Terminal B (esperar ~15s)
cd infra\registry-server
mvn spring-boot:run

# Terminal C
cd infra\gateway
mvn spring-boot:run
```

Comprobar:

- http://localhost:7071/auth-ms/dev
- http://localhost:7081 (Eureka)
- http://localhost:7091/actuator/health

## Paso 3 - Microservicios (5 terminales)

```powershell
cd auth      ; mvn spring-boot:run
cd canchas   ; mvn spring-boot:run
cd horarios  ; mvn spring-boot:run
cd reservas  ; mvn spring-boot:run
cd pago      ; mvn spring-boot:run
```

En Eureka deben aparecer: `AUTH-MS`, `CANCHAS-MS`, `HORARIOS-MS`, `RESERVAS-MS`, `PAGO-MS`.

## Paso 4 - Observabilidad

```powershell
cd observability
docker compose -f compose-dev.yml up -d
```

## Paso 4b - Kafka (mensajería async)

```powershell
cd kafka
docker compose -f compose-dev.yml up -d
```

- **Kafka UI**: http://localhost:41085
- Bootstrap: `localhost:41092`

Topics: `reserva-eventos`, `pago-eventos`

---

## Paso 5 - Observabilidad URLs

- Grafana: http://localhost:13000 (admin/admin) → Dashboard **Reservas MS**
- Prometheus: http://localhost:19090

## Paso 6 - Prueba rapida JWT

```powershell
# Login
curl -X POST http://localhost:7091/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"

# Copiar accessToken y probar
curl http://localhost:7091/api/v1/canchas -H "Authorization: Bearer TOKEN_AQUI"
```

## Paso 7 - Balanceo (2 instancias reservas-ms)

```powershell
# Terminal 1
cd reservas
mvn spring-boot:run

# Terminal 2
cd reservas
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=9184
```

```powershell
curl http://localhost:7091/api/v1/reserva/instancia
# Repetir: debe alternar puerto 9084 y 9184
```

## Problemas frecuentes

| Error | Solucion |
|-------|----------|
| Config no carga | Verificar `auth-ms-dev.yml` existe en `infra/config-repo/` |
| 401 en Gateway | Hacer login y pasar `Authorization: Bearer ...` |
| Eureka vacio | Levantar registry antes que los MS |
| Grafana sin datos | Microservicios deben estar en 9081-9085 con Prometheus activo |
| Puerto PG ocupado | Cambiar puerto en `compose-dev.yml` y en `*-ms-dev.yml` |
