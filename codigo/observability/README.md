# Observability Stack

Stack: **Prometheus** + **Loki** + **Promtail** + **Grafana** con dashboard y alertas preconfigurados.

## Levantar (DEV)

```bash
cd observability
docker compose -f compose-dev.yml up -d
```

URLs:

| Herramienta | URL |
|-------------|-----|
| Grafana | http://localhost:13000 (admin/admin) |
| Prometheus | http://localhost:19090 |
| Loki | http://localhost:13100 |

## Dashboard

Al iniciar Grafana, el dashboard **Microservicios - Reservas Deportivas** se carga automaticamente en la carpeta `Reservas MS`.

Paneles incluidos:

- Disponibilidad (`up`)
- Requests por segundo
- Errores HTTP 5xx
- Memoria JVM
- CPU del sistema
- Circuit Breaker (reservas)
- Logs centralizados (Loki)

## Alertas Prometheus

Archivo: `prometheus/alerts.yml`

| Alerta | Condicion |
|--------|-----------|
| ServicioCaido | `up == 0` por 1 min |
| AltaTasaErrores5xx | tasa 5xx > umbral |
| CircuitBreakerAbierto | resilience4j state open |

Ver alertas activas: http://localhost:19090/alerts

## Requisitos

Microservicios corriendo en puertos 9081-9085 con `actuator/prometheus` habilitado y logs en carpeta `logs/` de cada servicio.

## Detener

```bash
docker compose -f compose-dev.yml down
```
