# S02 - Configuración y Ambientes

## 1. Propósito

Centralizar la configuración de todos los microservicios mediante Spring Cloud Config Server y definir las variables de entorno por ambiente (dev / prod).

## 2. Config Server

El **Config Server** (puerto 7071) sirve archivos YAML desde el repositorio `infra/config-repo/`. Cada microservicio arranca con un `application.yml` mínimo que solo indica cómo conectarse al servidor de configuración.

```
infra/
├── config-server/     — Spring Cloud Config Server
├── config-repo/       — Archivos de configuración por servicio y ambiente
│   ├── auth-ms-dev.yml
│   ├── canchas-ms-dev.yml
│   ├── horarios-ms-dev.yml
│   ├── reservas-ms-dev.yml
│   └── pago-ms-dev.yml
├── registry-server/   — Eureka
└── gateway/           — API Gateway
```

### Verificar configuración cargada

```powershell
# Formato: /{nombre-servicio}/{ambiente}
curl http://localhost:7071/auth-ms/dev
curl http://localhost:7071/canchas-ms/dev
curl http://localhost:7071/reservas-ms/dev
```

## 3. Variables de ambiente importantes

### auth-ms-dev.yml (referencia)

```yaml
server:
  port: 9081

spring:
  datasource:
    url: jdbc:postgresql://localhost:5431/db_auth
    username: reservas
    password: reservas
  jpa:
    hibernate:
      ddl-auto: validate

jwt:
  secret: <secret-key>
  expiration: 86400000  # 24h en ms

eureka:
  client:
    service-url:
      defaultZone: http://localhost:7081/eureka/
```

### Ambientes disponibles

| Ambiente | Sufijo de archivo | Propósito |
|----------|-------------------|-----------|
| Desarrollo | `-dev.yml` | Local con Docker |
| Producción | `-prod.yml` | Contenedores en servidor |

## 4. Variables críticas por servicio

| Variable | Servicio | Descripción |
|----------|---------|-------------|
| `jwt.secret` | auth | Clave secreta para firmar tokens JWT |
| `jwt.expiration` | auth | Tiempo de expiración en ms (default: 86400000 = 24h) |
| `spring.datasource.url` | todos | URL de conexión a PostgreSQL |
| `spring.kafka.bootstrap-servers` | reservas, pago | Broker Kafka |
| `eureka.client.service-url` | todos | URL del registry |
| `spring.cloud.config.uri` | todos | URL del Config Server |

## 5. Frontend — variables de entorno

El frontend Angular utiliza archivos en `frontend/src/environments/`:

```typescript
// environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:7092',        // Gateway
  keycloakUrl: 'http://localhost:18080',   // Keycloak
  keycloakRealm: 'reservas',
  keycloakClientId: 'frontend'
};
```

```typescript
// environment.prod.ts (producción)
export const environment = {
  production: true,
  apiUrl: 'https://api.tu-dominio.com',
  keycloakUrl: 'https://auth.tu-dominio.com',
  keycloakRealm: 'reservas',
  keycloakClientId: 'frontend'
};
```

## 6. Keycloak — configuración de ambiente

El realm `reservas` se importa automáticamente al levantar el contenedor:

```yaml
# keycloak/compose-dev.yml
keycloak:
  image: quay.io/keycloak/keycloak:25.0.2
  command: start-dev --import-realm
  environment:
    KEYCLOAK_ADMIN: admin
    KEYCLOAK_ADMIN_PASSWORD: admin
    KC_DB: postgres
    KC_HTTP_PORT: 8080
  volumes:
    - ./realm-export.json:/opt/keycloak/data/import/realm-export.json:ro
  ports:
    - "18080:8080"
```

Para exportar el realm después de cambios manuales en la UI:

```powershell
docker exec reservas-keycloak-dev /opt/keycloak/bin/kc.sh export `
  --dir /opt/keycloak/data/export `
  --realm reservas `
  --users realm_file
```

## 7. Observabilidad — configuración

```yaml
# observability/prometheus/prometheus-dev.yml (extracto)
scrape_configs:
  - job_name: auth-dev
    static_configs:
      - targets: ['host.docker.internal:9081']
  - job_name: canchas-dev
    static_configs:
      - targets: ['host.docker.internal:9082']
  # ... horarios (9083), reservas (9084), pago (9085)
```

Todos los microservicios exponen métricas en `/actuator/prometheus`.

## 8. Problemas frecuentes de configuración

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| `Could not locate PropertySource` | Config Server no está corriendo | Levantar config-server antes que los MS |
| `Connection refused` al Config Server | Puerto 7071 ocupado o server no inició | Revisar logs de config-server |
| `auth-ms-dev.yml not found` | Archivo no existe en config-repo | Crear el archivo en `infra/config-repo/` |
| JWT secret mismatch | Secret distinto entre config y gateway | Sincronizar `jwt.secret` en ambos |
