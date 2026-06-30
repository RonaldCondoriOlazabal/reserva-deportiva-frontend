# S14 - Revisión Técnica

## 1. Propósito

Revisar la calidad técnica del sistema: estructura del código, patrones de diseño aplicados, configuración de seguridad, manejo de errores y decisiones de arquitectura que demuestren madurez en el desarrollo de sistemas distribuidos.

## 2. Resultado de aprendizaje

El equipo demuestra comprensión profunda de las decisiones de diseño tomadas, puede justificar cada componente y mostrar evidencia técnica de buenas prácticas implementadas.

## 3. Producto de sesión

Revisión guiada del código con evidencia de:
- Patrones de arquitectura aplicados correctamente
- Seguridad implementada en capas
- Resiliencia y manejo de errores
- Observabilidad integrada al código
- Calidad de APIs REST

## 4. Arquitectura del sistema

### Diagrama de componentes

```
                        [ Browser / Angular 22 ]
                               |  :4200
                               ↓
                        [ API Gateway :7092 ]
                    JWT validation · CORS · LB
                               |
           ┌───────────────────┼────────────────────┐
           ↓                   ↓                    ↓
    [ auth-ms :9081 ]   [ canchas-ms :9082 ]  [ horarios-ms :9083 ]
    JWT + Users         Courts CRUD           Schedules CRUD
    PostgreSQL :5431    PostgreSQL :5432      PostgreSQL :5433
           |                   ↑ Feign              ↑ Feign
           |            ┌──────┴──────────────────┐
           |            ↓                         |
    [ reservas-ms :9084 ]                  [ pago-ms :9085 ]
    Reservations CRUD                      Payments CRUD
    Kafka Producer                         Kafka Consumer
    PostgreSQL :5434                       PostgreSQL :5435
           |                                       ↑
           └──────── Kafka :41092 ─────────────────┘
                   reserva-eventos
                   pago-eventos

    [ Config Server :7071 ] ← todos los MS cargan config desde aquí
    [ Eureka :7081 ]         ← todos los MS se registran aquí
    [ Keycloak :18080 ]      ← autenticación OIDC (dueños)

    [ Prometheus :19090 ] ← scraping /actuator/prometheus
    [ Loki :13100 ]        ← logs de todos los MS
    [ Grafana :13000 ]     ← dashboards + alertas
```

### Patrones aplicados

| Patrón | Implementación |
|--------|---------------|
| Database per Service | Cada MS tiene su propio PostgreSQL en puerto distinto |
| API Gateway | Spring Cloud Gateway en `:7092` como único punto de entrada |
| Service Registry | Eureka: los MS se registran y descubren por nombre |
| Config Server | Spring Cloud Config: configuración externalizada por perfil |
| Circuit Breaker | Resilience4j en `reservas-ms` → `canchas-ms` / `horarios-ms` |
| Async Messaging | Kafka: desacopla `reservas-ms` de `pago-ms` |
| Correlation ID | `CorrelationIdFilter` en todos los MS para trazabilidad |
| DTO pattern | Request/Response separados de las entidades JPA |
| Repository pattern | Spring Data JPA repositories con interfaces |

## 5. Revisión de código por capa

### 5.1 Capa de controladores

Todos los controllers siguen el mismo patrón REST:

```java
// Ejemplo: ReservaController
@RestController
@RequestMapping("/api/v1/reservas")
@RequiredArgsConstructor
public class ReservaController {
    private final ReservaService service;

    @PostMapping
    public ResponseEntity<ReservaResponse> create(@Valid @RequestBody ReservaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservaResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }
    // ...
}
```

**Puntos a revisar:**
- `@Valid` en todos los request bodies
- Códigos HTTP semánticos (`201 Created`, `204 No Content`)
- Separación entre controlador y lógica de negocio

### 5.2 Capa de seguridad

```java
// SecurityConfig en auth-ms
// JWT generado con JJWT 0.12.7, firmado con HS256
// Gateway valida el token antes de enrutar

// Roles en Gateway (application.yml del config-server):
// GET /api/v1/canchas    → público
// POST /api/v1/canchas   → ADMIN
// /api/v1/reservas/**    → autenticado
// /api/v1/pagos/**       → autenticado
```

**Puntos a revisar:**
- JWT validado en Gateway, no en cada microservicio
- Claims del token incluyen `role` y `sub` (username)
- `JwtProperties` carga el secret desde Config Server (no hardcodeado)

### 5.3 Comunicación entre servicios

```java
// FeignClient en reservas-ms
@FeignClient(name = "canchas-ms", fallback = CanchaClientFallback.class)
public interface CanchaClient {
    @GetMapping("/api/v1/canchas/{id}")
    CanchaResponse findById(@PathVariable Long id);
}

// Fallback cuando canchas-ms no responde
@Component
public class CanchaClientFallback implements CanchaClient {
    public CanchaResponse findById(Long id) {
        return CanchaResponse.builder()
            .id(id)
            .nombre("Servicio no disponible")
            .build();
    }
}
```

### 5.4 Mensajería Kafka

```java
// Productor en reservas-ms
@Service
public class ReservaService {
    private final KafkaTemplate<String, EventoReserva> kafkaTemplate;

    public ReservaResponse create(ReservaRequest req) {
        Reserva reserva = repository.save(mapper.toEntity(req));
        kafkaTemplate.send("reserva-eventos",
            new EventoReserva(reserva.getId(), reserva.getIdCancha(), ...));
        return mapper.toResponse(reserva);
    }
}

// Consumidor en pago-ms
@KafkaListener(topics = "reserva-eventos")
public void onReservaCreada(EventoReserva evento) {
    Pago pago = Pago.builder()
        .idReserva(evento.getIdReserva())
        .metodoPago("KAFKA")
        .estado("PENDIENTE")
        .build();
    pagoRepository.save(pago);
}
```

### 5.5 Observabilidad integrada

```yaml
# Configuración Prometheus en cada MS (config-repo)
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,circuitbreakers
  metrics:
    export:
      prometheus:
        enabled: true
```

```java
// CorrelationIdFilter en todos los MS
@Component
public class CorrelationIdFilter implements Filter {
    public void doFilter(ServletRequest req, ...) {
        String correlationId = UUID.randomUUID().toString();
        MDC.put("correlationId", correlationId);
        // Se incluye en todos los logs automáticamente
    }
}
```

## 6. Calidad de las APIs

### Endpoints documentados con OpenAPI

Cada microservicio expone Swagger UI en:

| Servicio | Swagger URL |
|----------|------------|
| auth-ms | http://localhost:9081/swagger-ui.html |
| canchas-ms | http://localhost:9082/swagger-ui.html |
| horarios-ms | http://localhost:9083/swagger-ui.html |
| reservas-ms | http://localhost:9084/swagger-ui.html |
| pago-ms | http://localhost:9085/swagger-ui.html |

### Convenciones REST aplicadas

| Convención | Aplicación en el proyecto |
|-----------|--------------------------|
| Sustantivos en plural | `/api/v1/canchas`, `/api/v1/reservas` |
| Versionado en URL | `/api/v1/...` en todos los endpoints |
| Verbos HTTP semánticos | GET=leer, POST=crear, PUT=actualizar, DELETE=eliminar |
| Códigos de respuesta | 200, 201, 204, 400, 401, 403, 404, 500 |
| DTOs separados | `*Request` para entrada, `*Response` para salida |

## 7. Decisiones técnicas a defender

| Decisión | Justificación |
|----------|--------------|
| Java 17 + Spring Boot 3.5 | LTS vigente, compatibilidad con Spring Cloud 2025 |
| PostgreSQL 16 por servicio | Database-per-service: autonomía y sin acoplamiento de esquema |
| Kafka KRaft (sin ZooKeeper) | Kafka 4.x elimina la dependencia de ZooKeeper, simplificando la operación |
| Keycloak para registro de dueños | Estándar de la industria para OIDC/OAuth2, evita implementar registro manual |
| Angular 22 con lazy loading | Carga bajo demanda por rol: ADMIN, DUENO, CLIENTE no comparten bundles |
| Gateway en puerto 7092 con frontend | Puerto diferente a 7091 para separar tráfico de API del tráfico browser |

## 8. Áreas de mejora identificadas

| Área | Estado actual | Mejora sugerida |
|------|--------------|----------------|
| Tests unitarios | Sin evidencia en el repo | Agregar JUnit 5 + Mockito por servicio |
| Tests E2E frontend | Vitest configurado sin tests | Implementar tests con Angular Testing Library |
| Refresh token | Implementado en `KeycloakService` | Agregar manejo de expiración automático |
| Rate limiting | No implementado en Gateway | Agregar `RequestRateLimiter` en rutas públicas |
| HTTPS | Solo HTTP en dev | Configurar TLS para producción |
| `infra/` en el repo | Carpeta vacía (no versionada) | Versionar Config Server, Eureka y Gateway |
