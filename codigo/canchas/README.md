# canchas-ms

Microservicio de gestión de canchas deportivas.  
**Responsable:** jhonsaul1234

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/canchas` | Listar todas las canchas |
| GET | `/api/v1/canchas/{id}` | Obtener cancha por ID |
| POST | `/api/v1/canchas` | Crear nueva cancha (ADMIN) |
| PUT | `/api/v1/canchas/{id}` | Actualizar cancha (ADMIN) |
| DELETE | `/api/v1/canchas/{id}` | Eliminar cancha (ADMIN) |

## Puerto

`9082` — Base de datos PostgreSQL en puerto `5432` (`db_canchas`)

## Levantar

```powershell
cd canchas
docker compose -f compose-dev.yml up -d
mvn spring-boot:run
```

Swagger UI: http://localhost:9082/swagger-ui.html
