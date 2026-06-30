# S03 - Registro y Descubrimiento

## 1. Propósito

Implementar el registro automático de microservicios mediante **Netflix Eureka** y el descubrimiento de servicios para comunicación inter-servicio sin URLs estáticas.

## 2. Eureka Registry Server

El **Registry Server** (puerto 7081) actúa como directorio central: todos los microservicios se registran al arrancar y se dan de baja al apagarse.

```
reservas-ms ─────┐
pago-ms      ────┤
canchas-ms   ────┼──▶  Eureka Registry (7081)
horarios-ms  ────┤
auth-ms      ────┘
                        ▲
                        │ consulta
                 reservas-ms (al llamar a horarios-ms via Feign)
```

Dashboard: http://localhost:7081

## 3. Registro en los microservicios

Cada servicio declara `@EnableDiscoveryClient` y configura Eureka en su archivo de configuración:

```yaml
# En cada *-ms-dev.yml
eureka:
  client:
    service-url:
      defaultZone: http://localhost:7081/eureka/
  instance:
    prefer-ip-address: true
```

Los nombres de aplicación registrados:

```yaml
spring:
  application:
    name: auth-ms   # canchas-ms | horarios-ms | reservas-ms | pago-ms
```

## 4. Servicios registrados esperados

| Nombre en Eureka | Instancias mínimas | Puerto(s) |
|-----------------|-------------------|-----------|
| `AUTH-MS` | 1 | 9081 |
| `CANCHAS-MS` | 1 | 9082 |
| `HORARIOS-MS` | 1 | 9083 |
| `RESERVAS-MS` | 1-2 | 9084, 9184 |
| `PAGO-MS` | 1 | 9085 |

## 5. Descubrimiento con OpenFeign

`reservas-ms` llama a `canchas-ms` y `horarios-ms` usando el nombre lógico de Eureka, sin URL estática:

```java
// En reservas-ms
@FeignClient(name = "canchas-ms")
public interface CanchaClient {
    @GetMapping("/api/v1/canchas/{id}")
    CanchaResponse getCanchaById(@PathVariable Long id);
}

@FeignClient(name = "horarios-ms")
public interface HorarioClient {
    @GetMapping("/api/v1/horarios/{id}")
    HorarioResponse getHorarioById(@PathVariable Long id);
}
```

Spring Cloud LoadBalancer resuelve el nombre `canchas-ms` consultando Eureka y distribuye las peticiones entre las instancias disponibles.

## 6. Gateway y enrutamiento dinámico

El API Gateway también consulta Eureka para enrutar las peticiones:

```yaml
# gateway config (extracto)
spring:
  cloud:
    gateway:
      routes:
        - id: auth-ms
          uri: lb://AUTH-MS          # lb:// = load balanced via Eureka
          predicates:
            - Path=/auth/**, /api/v1/usuarios/**

        - id: canchas-ms
          uri: lb://CANCHAS-MS
          predicates:
            - Path=/api/v1/canchas/**

        - id: horarios-ms
          uri: lb://HORARIOS-MS
          predicates:
            - Path=/api/v1/horarios/**

        - id: reservas-ms
          uri: lb://RESERVAS-MS
          predicates:
            - Path=/api/v1/reservas/**, /api/v1/reserva/**

        - id: pago-ms
          uri: lb://PAGO-MS
          predicates:
            - Path=/api/v1/pagos/**
```

## 7. Endpoint de instancia (prueba de descubrimiento)

Cada microservicio expone un endpoint para identificar qué instancia está respondiendo:

```java
// GatewayInstanciasController.java (en todos los MS)
@GetMapping("/api/v1/reserva/instancia")
public ResponseEntity<String> instancia(HttpServletRequest request) {
    return ResponseEntity.ok("Instancia respondiendo en puerto: " + request.getServerPort());
}
```

Probar desde el gateway:

```powershell
# Ejecutar varias veces — debe alternar entre instancias
for ($i=0; $i -lt 5; $i++) {
    curl http://localhost:7091/api/v1/reserva/instancia
}
```

## 8. Levantar con múltiples instancias

```powershell
# Instancia 1 (puerto por defecto: 9084)
cd reservas
mvn spring-boot:run

# Instancia 2 (puerto alternativo: 9184)
cd reservas
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=9184
```

En Eureka, `RESERVAS-MS` debe aparecer con **2 instancias** (9084 y 9184).

## 9. Health checks y heartbeat

Eureka usa heartbeats cada 30 segundos. Si un servicio no responde en 90 segundos, se da de baja automáticamente.

```powershell
# Verificar estado del registry
curl http://localhost:7081/actuator/health

# Ver todos los servicios registrados (JSON)
curl http://localhost:7081/eureka/apps
```

## 10. Orden de arranque requerido

```
1. Config Server  (7071)  ← todos los MS necesitan configuración
2. Registry Server (7081)  ← el Gateway y MS necesitan registrarse
3. API Gateway    (7091)  ← punto de entrada único
4. Microservicios (9081-9085)
```

> Si se levanta un microservicio antes que el Config Server, fallará con `Could not locate PropertySource`.
