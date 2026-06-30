# ms-pago

Microservicio encargado de gestionar los pagos de reservas deportivas dentro del sistema distribuido **microservicios-reservas**.

## Descripción

Este microservicio procesa los pagos asociados a las reservas de canchas deportivas. Se comunica de forma asíncrona con el microservicio de reservas mediante **Apache Kafka**, publicando y consumiendo eventos de pago.

## Responsabilidades

- Registrar pagos de reservas
- Consultar el estado de un pago
- Publicar eventos de pago procesado vía Kafka
- Consumir eventos de reserva confirmada vía Kafka

## Tecnologías

- Java 17 + Spring Boot 3
- Spring Data JPA + PostgreSQL
- Apache Kafka (productor y consumidor)
- Spring Cloud Netflix Eureka (registro de servicio)
- OpenAPI / Swagger UI
- Docker + Docker Compose

## Estructura

```
ms-pago/
├── controller/      # Endpoints REST
├── service/         # Lógica de negocio
├── repository/      # Acceso a base de datos
├── entity/          # Entidades JPA
├── dto/             # Objetos de transferencia
├── evento/          # Eventos Kafka
├── mapper/          # Conversión entity <-> dto
├── config/          # Configuración Kafka y OpenAPI
├── exception/       # Manejo global de errores
└── filter/          # Filtro de correlación
```

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/pagos` | Registrar un nuevo pago |
| GET | `/api/pagos/{id}` | Consultar pago por ID |
| GET | `/api/pagos/reserva/{reservaId}` | Consultar pago por reserva |

## Responsable

- **Nestor Elisban Huaylla Pila** — Microservicio de Pagos (`ms-pago`)
