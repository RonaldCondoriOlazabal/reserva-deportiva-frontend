# S16 - Evaluación Final

## 1. Instrucciones iniciales

**Tiempo:** 15 minutos por estudiante.

### 1.1 Propósito

Brindar una instancia final para que estudiantes con competencias pendientes demuestren logro técnico de forma individual, operando y defendiendo su parte del sistema de reservas deportivas.

### 1.2 Resultado de aprendizaje

El estudiante demuestra que puede implementar, ejecutar, diagnosticar o defender una parte crítica del sistema sin depender del grupo.

### 1.3 Producto de sesión

Evidencia individual de logro de competencias pendientes: el sistema funciona, el estudiante lo opera y explica las decisiones técnicas tomadas.

### 1.4 Preguntas del docente durante la sustentación

La competencia profesional se demuestra cuando el estudiante puede operar, explicar y defender una parte del sistema bajo condiciones controladas.

Ejemplos de preguntas:
- ¿Por qué este microservicio tiene su propia base de datos?
- ¿Qué pasa si `canchas-ms` cae mientras un cliente está reservando?
- ¿Cómo garantizas que el pago se procesa aunque `pago-ms` esté caído momentáneamente?
- Muéstrame el circuit breaker abierto y explica qué retorna el fallback.
- ¿Dónde en el código se valida el JWT?

### 1.5 Ubicación en el curso

```
Unidad 1 (S1-S5)   → Servicio base, config, registro, gateway, evaluación
Unidad 2 (S6-S12)  → Sistema distribuido robusto, evaluación
Consolidación       → S13 Validación E2E
                     S14 Revisión técnica
                     S15 Defensa técnica
                   ► S16 Evaluación final  ← estamos aquí
```

---

## 2. Encuadre de la evaluación

### 2.1 Arquitectura del producto del curso

Sistema de reservas deportivas con arquitectura de microservicios:

```
[ Angular 22 Frontend :4200 ]
          |
[ API Gateway :7092 ]
     JWT · CORS · LB
          |
   ┌──────┼──────────────┐
   |      |              |
auth-ms  canchas-ms  horarios-ms
:9081    :9082        :9083
   |        ↑ Feign        ↑ Feign
   |   [ reservas-ms :9084 ] ──Kafka──→ [ pago-ms :9085 ]
   |
[ Config :7071 ] · [ Eureka :7081 ] · [ Keycloak :18080 ]
[ Prometheus :19090 ] · [ Loki :13100 ] · [ Grafana :13000 ]
```

### 2.2 Tiempo de evaluación

| Actividad | Tiempo |
|-----------|--------|
| Preparación del sistema | Antes de la sesión |
| Demostración del flujo base | 5 min |
| Preguntas técnicas del docente | 7 min |
| Retroalimentación | 3 min |

---

## 3. Demostración individual de competencias pendientes

### 3.1 Evidencia para la evaluación

#### 3.1.1 Datos del estudiante

Completar antes de la sustentación:

```
Nombre completo  : ________________________________
Código           : ________________________________
Módulo asignado  : ________________________________
  (auth-ms / canchas-ms / horarios-ms / reservas-ms / pago-ms / frontend / infra)
Competencia(s) pendiente(s):
  [ ] Servicio base funcional
  [ ] Comunicación síncrona (Feign + Circuit Breaker)
  [ ] Seguridad distribuida (JWT + roles)
  [ ] Mensajería asíncrona (Kafka)
  [ ] Observabilidad (Grafana + Prometheus + Loki)
  [ ] Integración frontend Angular
```

#### 3.1.2 Evidencia técnica individual

Preparar antes de la sesión:

```powershell
# 1. Sistema corriendo
docker ps --format "table {{.Names}}\t{{.Status}}"

# 2. Login funcional
curl -X POST http://localhost:7091/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}'

# 3. Endpoints de tu módulo respondiendo
# Reemplazar con los endpoints del módulo asignado
curl http://localhost:7091/api/v1/[tu-modulo] `
  -H "Authorization: Bearer TU_TOKEN"

# 4. Swagger UI de tu microservicio
Start-Process "http://localhost:[puerto-tu-ms]/swagger-ui.html"
```

### 3.2 Secuencia de demostración individual

**Opción A — Módulo de dominio (auth / canchas / horarios / reservas / pago)**

```
1. Mostrar el microservicio registrado en Eureka
2. Ejecutar el CRUD completo del módulo (GET, POST, PUT, DELETE)
3. Mostrar el Swagger UI generado
4. Explicar una decisión de código (mapper, DTO, circuit breaker, etc.)
5. Mostrar métricas del servicio en Grafana
```

**Opción B — Módulo de infraestructura (infra / gateway)**

```
1. Mostrar Config Server respondiendo con config de 2 servicios
2. Mostrar Eureka con los 5 servicios registrados
3. Demostrar enrutamiento del Gateway con y sin JWT
4. Mostrar políticas de seguridad por rol (ADMIN vs CLIENTE)
5. Demostrar balanceo de carga con 2 instancias
```

**Opción C — Frontend Angular**

```
1. Mostrar la aplicación en http://localhost:4200
2. Login con admin y con cliente (diferentes paneles)
3. Flujo completo: explorar cancha → reservar → pagar → comprobante
4. Abrir DevTools → Network: mostrar que todos los calls van al Gateway
5. Explicar el AuthInterceptor y cómo se adjunta el token
```

**Opción D — Mensajería / Observabilidad**

```
1. Kafka UI: mostrar topics con mensajes
2. Crear reserva → mostrar evento en Kafka UI en tiempo real
3. Mostrar que pago-ms consumió el evento
4. Grafana: mostrar dashboard con métricas de todos los servicios
5. Loki: trazar una petición por correlationId de principio a fin
```

### 3.3 Criterios mínimos de aceptación

| Criterio | Evidencia requerida |
|----------|---------------------|
| **El sistema corre** | `docker ps` muestra las BDs; Eureka tiene al menos 3 servicios |
| **El módulo funciona** | Al menos 2 operaciones CRUD ejecutadas exitosamente en vivo |
| **Comprensión del código** | Puede señalar en el código cómo funciona una característica |
| **Sin errores 500 en el flujo demo** | La demostración principal no falla |
| **Responde al menos 2 preguntas técnicas** | Con evidencia, no de memoria |

---

## 4. Retroalimentación posterior

### 4.1 Mejoras y próximos pasos

Áreas de mejora identificadas en el proyecto:

| Área | Descripción | Prioridad |
|------|-------------|-----------|
| Tests unitarios | JUnit 5 + Mockito por microservicio | Alta |
| Tests E2E | Angular Testing Library + Vitest | Media |
| Rate limiting | `RequestRateLimiter` en Gateway para rutas públicas | Media |
| HTTPS / TLS | Configurar certificados para entorno de producción | Alta |
| Versionar `infra/` | Config Server, Eureka y Gateway no están en el repo | Alta |
| Refresh token automático | Manejo de expiración sin logout forzado | Media |
| CI/CD | Pipeline de build + test automático (GitHub Actions) | Baja |

### 4.2 Extensiones posibles del proyecto

- **Notificaciones**: agregar `notificaciones-ms` que consuma `pago-eventos` y envíe email/SMS
- **Búsqueda avanzada**: integrar Elasticsearch para búsqueda de canchas por ubicación o tipo
- **Pagos reales**: integrar con MercadoPago o PayPal en lugar del pago simulado
- **Mobile**: adaptar el frontend con Ionic o construir app React Native consumiendo el mismo Gateway
- **Multi-tenant**: soporte para múltiples organizaciones deportivas con realm por tenant en Keycloak

---

## 5. Comandos de referencia rápida

```powershell
# Levantar todo el stack
docker network create ms-net
cd auth     ; docker compose -f compose-dev.yml up -d
cd ..\canchas  ; docker compose -f compose-dev.yml up -d
cd ..\horarios ; docker compose -f compose-dev.yml up -d
cd ..\reservas ; docker compose -f compose-dev.yml up -d
cd ..\pago     ; docker compose -f compose-dev.yml up -d
cd ..\kafka    ; docker compose -f compose-dev.yml up -d
cd ..\keycloak ; docker compose -f compose-dev.yml up -d
cd ..\observability ; docker compose -f compose-dev.yml up -d

# Infraestructura Spring (en orden)
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

# URLs clave
# http://localhost:4200   Frontend Angular
# http://localhost:7091   Gateway (APIs)
# http://localhost:7081   Eureka
# http://localhost:18080  Keycloak
# http://localhost:13000  Grafana (admin/admin)
# http://localhost:19090  Prometheus
# http://localhost:41085  Kafka UI
```
