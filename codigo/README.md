# Reserva Deportiva — Sistema Distribuido

Sistema de reservas de canchas deportivas construido con arquitectura de microservicios.
Proyecto del curso **Sistemas Distribuidos — UPEU 2026-1**.

---

## Arquitectura

```
[ Angular 22 Frontend :4200 ]
          |
[ API Gateway :7092 ]
  JWT validation · CORS · Load Balancer
          |
   ┌──────┼──────────────────┐
   |      |                  |
auth-ms  canchas-ms     horarios-ms
:9081    :9082           :9083
PG:5431  PG:5432         PG:5433
                   ↑ Feign    ↑ Feign
            [ reservas-ms :9084 PG:5434 ]
                   |
                 Kafka (:41092)
                   |
            [ pago-ms :9085 PG:5435 ]

Infraestructura:
  Config Server :7071  →  configuración centralizada
  Eureka        :7081  →  registro y descubrimiento
  Keycloak      :18080 →  autenticación OIDC (dueños)

Observabilidad:
  Prometheus :19090  ·  Loki :13100  ·  Grafana :13000
  Kafka UI   :41085
```

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | Java + Spring Boot | 17 / 3.5.12 |
| Cloud | Spring Cloud | 2025.0.1 |
| Base de datos | PostgreSQL | 16 |
| Mensajería | Apache Kafka (KRaft) | 4.2.0 |
| Auth | Keycloak | 25.0.2 |
| Frontend | Angular + Angular Material | 22.0.0 |
| Observabilidad | Prometheus + Loki + Grafana | 2.54 / 2.9 / 11.1 |

---

## Inicio rápido

Ver **[docs/LEVANTAR-DEV.md](docs/LEVANTAR-DEV.md)** para instrucciones completas paso a paso.

```powershell
# Red Docker (una vez)
docker network create ms-net

# Bases de datos
cd auth     ; docker compose -f compose-dev.yml up -d
cd ..\canchas  ; docker compose -f compose-dev.yml up -d
cd ..\horarios ; docker compose -f compose-dev.yml up -d
cd ..\reservas ; docker compose -f compose-dev.yml up -d
cd ..\pago     ; docker compose -f compose-dev.yml up -d

# Infraestructura (en orden, ~15s entre cada uno)
cd ..\infra\config-server  ; mvn spring-boot:run
cd ..\registry-server ; mvn spring-boot:run
cd ..\gateway         ; mvn spring-boot:run

# Microservicios
cd ..\..\auth    ; mvn spring-boot:run
cd ..\canchas ; mvn spring-boot:run
cd ..\horarios; mvn spring-boot:run
cd ..\reservas; mvn spring-boot:run
cd ..\pago    ; mvn spring-boot:run

# Frontend
cd ..\frontend ; npm install ; ng serve
```

---

## Cuentas de prueba

| Usuario | Contraseña | Rol | Panel |
|---------|-----------|-----|-------|
| admin | admin123 | ADMIN | `/admin/dashboard` |
| user | user123 | CLIENTE | `/cliente/inicio` |
| *(registro)* | — | DUENO | `/registro/keycloak` → `/dueno/dashboard` |

---

## URLs del sistema

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:4200 |
| API Gateway | http://localhost:7091 |
| Eureka | http://localhost:7081 |
| Config Server | http://localhost:7071 |
| Keycloak | http://localhost:18080 |
| Kafka UI | http://localhost:41085 |
| Grafana | http://localhost:13000 (admin/admin) |
| Prometheus | http://localhost:19090 |

---

## Documentación del curso

| Sesión | Tema | Doc |
|--------|------|-----|
| S01 | Servicio base y estructura | [S01-servicio-base.md](docs/S01-servicio-base.md) |
| S02 | Configuración y ambientes | [S02-configuracion-ambientes.md](docs/S02-configuracion-ambientes.md) |
| S03 | Registro y descubrimiento (Eureka) | [S03-registro-descubrimiento.md](docs/S03-registro-descubrimiento.md) |
| S04 | Acceso único y tráfico (Gateway) | [S04-acceso-unico-trafico.md](docs/S04-acceso-unico-trafico.md) |
| S05 | Evaluación Unidad 1 | [S05-evaluacion-u1.md](docs/S05-evaluacion-u1.md) |
| S06 | Comunicación síncrona (Feign + CB) | [S06-comunicacion-sincrona.md](docs/S06-comunicacion-sincrona.md) |
| S07 | Seguridad distribuida (JWT + Keycloak) | [S07-seguridad-distribuida.md](docs/S07-seguridad-distribuida.md) |
| S08 | Mensajería asíncrona (Kafka) | [S08-mensajeria-asincrona.md](docs/S08-mensajeria-asincrona.md) |
| S09 | Consistencia distribuida | [S09-consistencia-distribuida.md](docs/S09-consistencia-distribuida.md) |
| S10 | Observabilidad y diagnóstico | [S10-observabilidad-diagnostico.md](docs/S10-observabilidad-diagnostico.md) |
| S11 | Integración frontend Angular | [S11-integracion-frontend.md](docs/S11-integracion-frontend.md) |
| S12 | Evaluación Unidad 2 | [S12-evaluacion-u2.md](docs/S12-evaluacion-u2.md) |
| S13 | Validación end-to-end | [S13-validacion-end-to-end.md](docs/S13-validacion-end-to-end.md) |
| S14 | Revisión técnica | [S14-revision-tecnica.md](docs/S14-revision-tecnica.md) |
| S15 | Defensa técnica | [S15-defensa-tecnica.md](docs/S15-defensa-tecnica.md) |
| S16 | Evaluación final | [S16-evaluacion-final.md](docs/S16-evaluacion-final.md) |

---

## Estructura del repositorio

```
codigo/
├── auth/          — auth-ms: JWT login + gestión de usuarios
├── canchas/       — canchas-ms: CRUD de canchas deportivas
├── horarios/      — horarios-ms: gestión de horarios/turnos
├── reservas/      — reservas-ms: reservas + productor Kafka
├── pago/          — pago-ms: pagos + consumidor Kafka
├── frontend/      — Angular 22: UI por roles (admin/dueno/cliente)
├── infra/         — Config Server, Eureka, API Gateway
├── kafka/         — Kafka KRaft + Kafka UI
├── keycloak/      — Keycloak 25 + realm reservas
├── observability/ — Prometheus + Loki + Promtail + Grafana
└── docs/          — Documentación del curso (S01–S16)
```

---

## Flujo de negocio principal

```
1. Cliente hace login  →  recibe JWT
2. Explora canchas disponibles  →  GET /api/v1/canchas
3. Selecciona horario  →  GET /api/v1/horarios?idCancha={id}
4. Crea reserva  →  POST /api/v1/reservas  (estado: PENDIENTE)
                     └─→ Kafka: evento reserva.creada
                         └─→ pago-ms: crea pago automático (KAFKA)
5. Confirma pago manual  →  POST /api/v1/pagos  (YAPE/BCP/etc.)
                            PUT  /api/v1/reservas/{id}  (CONFIRMADA)
                            PUT  /api/v1/horarios/{id}  (disponible: false)
6. Ve comprobante  →  GET /api/v1/pagos/{id}
```

---

## Requisitos previos

- **Docker Desktop** (con al menos 4 GB de memoria asignada)
- **Java 17** + Maven 3.9+
- **Node.js 20+** + Angular CLI 22