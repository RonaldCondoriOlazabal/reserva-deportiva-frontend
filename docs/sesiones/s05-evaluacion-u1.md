# S05 - Evaluación Unidad 1

## 1. Propósito

Validar que el sistema base está completamente operativo: infraestructura, microservicios, acceso único vía Gateway y políticas de seguridad JWT funcionando de extremo a extremo.

## 2. Resultado de aprendizaje

El equipo demuestra que puede levantar, verificar y defender la arquitectura base del sistema de reservas deportivas, desde la base de datos hasta el punto de entrada único.

## 3. Producto de sesión

Sistema corriendo con:
- 5 bases de datos PostgreSQL independientes
- Config Server, Eureka y Gateway activos
- 5 microservicios registrados en Eureka
- Login JWT funcional por el Gateway
- Políticas de rol verificables (`ADMIN` vs `USER`)

## 4. Checklist de evaluación U1

### Infraestructura
- [ ] `docker ps` muestra 5 contenedores `reservas-postgres-*` corriendo
- [ ] Config Server responde en `http://localhost:7071/auth-ms/dev`
- [ ] Eureka dashboard en `http://localhost:7081` muestra los 5 servicios
- [ ] Gateway health en `http://localhost:7091/actuator/health` retorna `UP`

### Seguridad
- [ ] Login con `admin/admin123` retorna `accessToken`
- [ ] Login con credenciales inválidas retorna `401`
- [ ] `USER` recibe `403` al intentar `POST /api/v1/canchas`
- [ ] `ADMIN` crea una cancha exitosamente con `POST /api/v1/canchas`
- [ ] Petición sin token a `/api/v1/reservas` retorna `401`

### Endpoints base
- [ ] `GET /api/v1/canchas` retorna lista (puede estar vacía, pero retorna `200`)
- [ ] `GET /api/v1/horarios` retorna lista
- [ ] `GET /api/v1/reservas` con token retorna lista

## 5. Comandos de verificación rápida

```powershell
# 1. Infraestructura
docker ps --format "table {{.Names}}\t{{.Status}}"
curl http://localhost:7071/auth-ms/dev
curl http://localhost:7081/actuator/health
curl http://localhost:7091/actuator/health

# 2. Login y token
$RES = curl -s -X POST http://localhost:7091/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}' | ConvertFrom-Json
$TOKEN = $RES.accessToken
Write-Host "Token obtenido: $($TOKEN.Substring(0,20))..."

# 3. Verificar rol ADMIN
curl -X POST http://localhost:7091/api/v1/canchas `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"nombre":"Cancha Fútbol 1","ubicacion":"Pabellón A","tipo":"futbol","activa":true}'

# 4. Verificar que USER recibe 403
$TOKEN_USER = (curl -s -X POST http://localhost:7091/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"user","password":"user123"}' | ConvertFrom-Json).accessToken

curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:7091/api/v1/canchas `
  -H "Authorization: Bearer $TOKEN_USER" `
  -H "Content-Type: application/json" `
  -d '{"nombre":"Test","ubicacion":"X","tipo":"futbol","activa":true}'
# Esperado: 403
```

## 6. Preguntas frecuentes en sustentación

| Pregunta | Respuesta esperada |
|----------|--------------------|
| ¿Por qué cada servicio tiene su propia BD? | Patrón *database-per-service*: autonomía, escalado independiente, sin acoplamiento de esquema |
| ¿Qué pasa si el Config Server no está? | Los microservicios no arrancan: `Could not locate PropertySource` |
| ¿Cómo sabe el Gateway a qué instancia enviar? | `lb://SERVICE-NAME` consulta Eureka y Spring Cloud LoadBalancer elige la instancia |
| ¿Por qué Eureka y no Consul/ZooKeeper? | Spring Cloud Eureka integra nativamente con Spring Boot sin dependencias externas |
| ¿Cómo se firma el JWT? | HS256 con la clave `jwt.secret` del Config Server; el Gateway y auth-ms comparten la misma clave |
