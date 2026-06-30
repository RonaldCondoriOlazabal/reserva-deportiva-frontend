# Reserva Deportiva — DISTribuidas 2026

Sistema distribuido de gestión de reservas de canchas deportivas construido con microservicios, Spring Cloud, Kafka y Angular.

## Producto del curso

```text
Sistema distribuido de microservicios end-to-end, configurable, escalable,
seguro, resiliente, consistente, observable, integrado con frontend Angular
y defendido técnicamente.
```

**Resultado esperado:** El estudiante implementa, integra y sustenta un sistema distribuido basado en microservicios para la gestión de reservas deportivas. La solución se ejecuta de forma reproducible en desarrollo local, expone evidencias de configuración centralizada, registro de servicios, enrutamiento, seguridad JWT + Keycloak, comunicación síncrona con circuit breaker, mensajería asíncrona con Kafka, observabilidad con Grafana/Prometheus/Loki e integración con cliente Angular. El producto se presenta en equipo pero cada estudiante evidencia y defiende su aporte individual.

---

## Arquitectura del sistema

```
[ Angular 22 Frontend :4200 ]
          |
[ API Gateway :7092 ]  ←── JWT validation · CORS · Load Balancer
          |
   ┌──────┼──────────────────┐
   |      |                  |
auth-ms  canchas-ms     horarios-ms
:9081    :9082           :9083
   |           ↑ Feign    ↑ Feign
   |      [ reservas-ms :9084 ]
   |              |
   |            Kafka
   |              |
   |        [ pago-ms :9085 ]
   |
Config Server :7071  ·  Eureka :7081  ·  Keycloak :18080
Prometheus :19090    ·  Loki :13100   ·  Grafana :13000
```

---

## Contenido del curso

### U1: Sistema distribuido base

Producto U1: sistema base funcional, configurable y preparado para múltiples instancias.

| Sesión | Tema | Producto |
|--------|------|---------|
| S1 | Servicio base y estructura de microservicios | 5 microservicios REST + infraestructura base |
| S2 | Configuración centralizada y ambientes | Config Server con perfiles dev/prod |
| S3 | Registro y descubrimiento de servicios | Eureka con 5 servicios registrados |
| S4 | Acceso único y distribución de tráfico | API Gateway con JWT y balanceo |
| S5 | Evaluación U1 | Sistema base integrado y funcionando |

### U2: Sistema distribuido robusto

Producto U2: sistema seguro, resiliente, consistente, observable e integrado con frontend.

| Sesión | Tema | Producto |
|--------|------|---------|
| S6 | Comunicación síncrona resiliente (Feign + CB) | Feign con fallback y circuit breaker |
| S7 | Seguridad distribuida (JWT + Keycloak) | Auth multicapa con roles ADMIN/DUENO/CLIENTE |
| S8 | Mensajería asíncrona (Kafka) | Eventos reserva-eventos y pago-eventos |
| S9 | Consistencia distribuida | Saga pattern con compensación |
| S10 | Observabilidad y diagnóstico | Grafana + Prometheus + Loki + alertas |
| S11 | Integración frontend Angular | UI por roles con SSR y Keycloak OIDC |
| S12 | Evaluación U2 | Sistema robusto validado |

### U3: Validación y consolidación

Producto U3 / producto del curso: sistema validado, documentado y defendido técnicamente.

| Sesión | Tema | Producto |
|--------|------|---------|
| S13 | Validación end-to-end | Flujo completo desde UI hasta Kafka |
| S14 | Revisión técnica | Patrones, decisiones de arquitectura y calidad |
| S15 | Defensa técnica | Demostración en vivo con fallas inducidas |
| S16 | Evaluación final | Evidencia individual de competencias |

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
| Contenedores | Docker + Docker Compose | — |

---

## Cuentas de prueba

| Usuario | Contraseña | Rol | Panel |
|---------|-----------|-----|-------|
| admin | admin123 | ADMIN | `/admin/dashboard` |
| user | user123 | CLIENTE | `/cliente/inicio` |
| *(registro Keycloak)* | — | DUENO | `/dueno/dashboard` |

## Repositorio

[github.com/RonaldCondoriOlazabal/reserva-deportiva-frontend](https://github.com/RonaldCondoriOlazabal/reserva-deportiva-frontend)
