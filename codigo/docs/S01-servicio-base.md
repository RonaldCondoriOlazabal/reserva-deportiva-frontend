# S01 - Servicio Base

## 1. Propósito

Establecer los microservicios fundamentales del sistema de reservas deportivas: estructura de proyecto, configuración centralizada, registro de servicios y primer endpoint funcional.

## 2. Arquitectura del servicio base

El sistema se construye sobre cinco microservicios de dominio más tres componentes de infraestructura:

```
┌─────────────────────────────────────────────────────┐
│              Microservicios de dominio               │
│                                                     │
│  auth-ms   canchas-ms   horarios-ms   reservas-ms   │
│  (9081)    (9082)       (9083)        (9084)         │
│                                                     │
│                      pago-ms                        │
│                      (9085)                         │
└─────────────────────────────────────────────────────┘
           │               │
    ┌──────┘               └──────┐
    ▼                             ▼
Config Server              Eureka Registry
(7071)                     (7081)
           │               │
           └───────┬───────┘
                   ▼
             API Gateway
              (7091/7092)
```

## 3. Stack tecnológico base

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Lenguaje | Java | 17 |
| Framework | Spring Boot | 3.5.12 |
| Cloud | Spring Cloud | 2025.0.1 |
| ORM | Spring Data JPA + Hibernate | — |
| Migraciones | Flyway | — |
| Base de datos | PostgreSQL | 16 |
| Contenedores | Docker + Docker Compose | — |

## 4. Estructura interna de cada microservicio

Todos los microservicios siguen el mismo patrón de paquetes:

```
com.upeu.<servicio>/
├── controller/      — Endpoints REST + GatewayInstanciasController
├── service/         — Interfaces de negocio
│   └── impl/        — Implementaciones
├── repository/      — Spring Data JPA repositories
├── entity/          — Entidades JPA
├── dto/             — Request / Response DTOs
├── mapper/          — Conversión entidad ↔ DTO
├── exception/       — ResourceNotFoundException, GlobalExceptionHandler
├── filter/          — CorrelationIdFilter (trazabilidad distribuida)
└── config/          — OpenApiConfig, KafkaConfig (donde aplica)
```

## 5. Configuración centralizada

Cada microservicio delega su configuración al **Config Server** mediante:

```yaml
# application.yml (en cada microservicio)
spring:
  config:
    import: "configserver:http://localhost:7071"
```

Los archivos de configuración específicos por entorno se almacenan en `infra/config-repo/`:

```
config-repo/
├── auth-ms-dev.yml
├── canchas-ms-dev.yml
├── horarios-ms-dev.yml
├── reservas-ms-dev.yml
└── pago-ms-dev.yml
```

## 6. Registro de servicios (Eureka)

Todos los microservicios se registran automáticamente en Eureka con estos nombres:

| Nombre en Eureka | Microservicio | Puerto |
|-----------------|---------------|--------|
| `AUTH-MS` | auth | 9081 |
| `CANCHAS-MS` | canchas | 9082 |
| `HORARIOS-MS` | horarios | 9083 |
| `RESERVAS-MS` | reservas | 9084 |
| `PAGO-MS` | pago | 9085 |

Dashboard Eureka: http://localhost:7081

## 7. Bases de datos (una por servicio)

Cada microservicio tiene su propia instancia PostgreSQL, siguiendo el patrón *database-per-service*:

| Microservicio | Puerto PG | Base de datos |
|---------------|-----------|---------------|
| auth | 5431 | db_auth |
| canchas | 5432 | db_canchas |
| horarios | 5433 | db_horarios |
| reservas | 5434 | db_reservas |
| pago | 5435 | db_pago |

Credenciales por defecto: `reservas` / `reservas`

## 8. Levantar el servicio base

```powershell
# 1 - Crear red compartida (una sola vez)
docker network create ms-net

# 2 - Levantar todas las bases de datos
cd auth     ; docker compose -f compose-dev.yml up -d
cd ..\canchas  ; docker compose -f compose-dev.yml up -d
cd ..\horarios ; docker compose -f compose-dev.yml up -d
cd ..\reservas ; docker compose -f compose-dev.yml up -d
cd ..\pago     ; docker compose -f compose-dev.yml up -d

# 3 - Infraestructura (en orden)
cd ..\infra\config-server  ; mvn spring-boot:run
# Esperar ~15s
cd ..\registry-server ; mvn spring-boot:run
cd ..\gateway         ; mvn spring-boot:run

# 4 - Microservicios
cd ..\..\auth     ; mvn spring-boot:run
cd ..\canchas  ; mvn spring-boot:run
cd ..\horarios ; mvn spring-boot:run
cd ..\reservas ; mvn spring-boot:run
cd ..\pago     ; mvn spring-boot:run
```

## 9. Verificación

```powershell
# Config Server responde
curl http://localhost:7071/auth-ms/dev

# Eureka tiene los 5 servicios
# Abrir: http://localhost:7081

# Gateway saludable
curl http://localhost:7091/actuator/health

# Primer endpoint - canchas (público)
curl http://localhost:7091/api/v1/canchas
```
