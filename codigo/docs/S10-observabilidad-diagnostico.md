# S10 - Observabilidad y Diagnóstico

## 1. Propósito

Implementar visibilidad total del sistema distribuido mediante el stack **Prometheus + Loki + Grafana**, con alertas configuradas y trazabilidad de peticiones entre microservicios.

## 2. Stack de observabilidad

```
┌─────────────────────────────────────────────────────────────┐
│                    Grafana :13000                            │
│           (dashboards, alertas, logs, métricas)             │
└────────────────┬──────────────────────┬─────────────────────┘
                 │                      │
        ┌────────┘                      └────────┐
        ▼                                        ▼
┌───────────────┐                    ┌───────────────────┐
│ Prometheus    │                    │       Loki        │
│   :19090      │                    │      :13100       │
│  (métricas)   │                    │  (logs agregados) │
└───────┬───────┘                    └────────┬──────────┘
        │  scrape /actuator/prometheus         │
        │                                     │  Promtail
        ▼                                     ▼  lee logs/
  auth-ms   canchas-ms   horarios-ms   reservas-ms   pago-ms
  :9081      :9082         :9083         :9084         :9085
```

## 3. Levantar el stack

```powershell
cd observability
docker compose -f compose-dev.yml up -d
```

Servicios levantados:
| Servicio | URL | Credenciales |
|---------|-----|-------------|
| Grafana | http://localhost:13000 | admin / admin |
| Prometheus | http://localhost:19090 | — |
| Loki | http://localhost:13100 | — |
| Kafka Exporter | http://localhost:41308/metrics | — |

## 4. Prometheus — métricas

### Targets de scraping

Prometheus raspa automáticamente los 5 microservicios:

```yaml
scrape_configs:
  - job_name: auth-dev
    static_configs:
      - targets: ['host.docker.internal:9081']
    metrics_path: /actuator/prometheus

  - job_name: canchas-dev
    targets: ['host.docker.internal:9082']

  - job_name: horarios-dev
    targets: ['host.docker.internal:9083']

  - job_name: reservas-dev
    targets: ['host.docker.internal:9084', 'host.docker.internal:9184']

  - job_name: pago-dev
    targets: ['host.docker.internal:9085']

  - job_name: kafka-dev
    targets: ['host.docker.internal:41308']
```

### Consultas útiles

```promql
# ¿Todos los servicios están arriba?
up{job=~".*-dev"}

# Tasa de peticiones por servicio (req/min)
sum by (job) (rate(http_server_requests_seconds_count[1m])) * 60

# Tasa de errores 5xx
rate(http_server_requests_seconds_count{status=~"5.."}[5m])

# Latencia p99 por servicio
histogram_quantile(0.99, 
  rate(http_server_requests_seconds_bucket[5m])
)

# Memoria JVM usada
jvm_memory_used_bytes{area="heap"}

# Estado del Circuit Breaker
resilience4j_circuitbreaker_state{name="reservasDetalle"}
```

### Alertas configuradas

| Alerta | Condición | Severidad |
|--------|-----------|-----------|
| `ServicioCaido` | `up == 0` por 1 min | critical |
| `AltaTasaErrores5xx` | tasa 5xx > umbral | warning |
| `CircuitBreakerAbierto` | estado = `OPEN` | warning |

Ver alertas en: http://localhost:19090/alerts

## 5. Loki — logs

### Consultas LogQL

```logql
# Todos los logs de reservas-ms
{service="reservas"}

# Errores en cualquier servicio
{service=~".+"} |= "ERROR"

# Buscar por traceId (trazabilidad entre servicios)
{service="reservas"} |= "traceId="

# Logs del consumidor Kafka en pago-ms
{service="pago"} |= "component=consumer"

# Latencia del procesamiento asíncrono
{service="pago"} |= "latencyMs=" | regexp `latencyMs=(?P<latency>\d+)`

# Fallback activado en Circuit Breaker
{service="reservas"} |= "Fallback activado"
```

### Estructura de logs

Los microservicios usan un formato estructurado (logback-spring.xml):

```
2026-07-01 08:00:00 [reservas-ms] INFO  ReservaServiceImpl - 
  service=reservas-ms event=reserva.creada reservaId=1 status=published

2026-07-01 08:00:01 [pago-ms] INFO  ReservaConsumer - 
  service=pago-ms component=consumer topic=reserva-eventos 
  reservaId=1 latencyMs=1200 status=consumed
```

## 6. Dashboard Grafana

El dashboard **"Microservicios - Reservas Deportivas"** se provisiona automáticamente con los siguientes paneles:

| Panel | Descripción |
|-------|-------------|
| Disponibilidad de servicios | Estado up/down de los 5 MS |
| Peticiones por segundo | Tráfico por servicio |
| Errores 5xx | Tasa de fallos |
| Latencia p50 / p99 | Tiempos de respuesta |
| JVM Heap | Memoria usada |
| CPU Usage | Uso de CPU |
| Circuit Breaker state | Estado de Resilience4j |
| Kafka Consumer Lag | Lag del grupo pago-ms-group |
| Logs en tiempo real | Panel Loki integrado |

## 7. Trazabilidad distribuida — Correlation ID

Cada petición recibe un `X-Correlation-ID` único que se propaga entre servicios:

```
Cliente ──▶ Gateway (genera X-Correlation-ID: abc123)
              │
              ▼
        reservas-ms (log: correlationId=abc123)
              │
              ├──▶ canchas-ms (log: correlationId=abc123)
              └──▶ horarios-ms (log: correlationId=abc123)
```

Buscar en Loki todos los logs de una petición:
```logql
{service=~".+"} |= "abc123"
```

## 8. Verificación completa

```powershell
# 1. Generar tráfico
for ($i=0; $i -lt 10; $i++) {
    curl -s http://localhost:7091/api/v1/canchas > $null
    Start-Sleep -Milliseconds 500
}

# 2. Verificar en Prometheus
# http://localhost:19090
# Query: up{job=~".*-dev"}  → todos deben mostrar 1

# 3. Verificar en Grafana
# http://localhost:13000 → dashboard "Microservicios - Reservas Deportivas"
# Debe mostrar métricas de los 5 servicios

# 4. Ver logs en Loki (desde Grafana Explore)
# {service="canchas"} → logs de las últimas peticiones

# 5. Provocar Circuit Breaker y ver alerta
# Apagar horarios-ms y llamar a /detalle → ver estado en Grafana
```

## 9. Diagnóstico de problemas con el stack

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Grafana sin datos | Prometheus no raspa los MS | Verificar que los MS tienen `/actuator/prometheus` expuesto |
| Prometheus targets DOWN | Microservicio caído o puerto incorrecto | Revisar que los MS están en 9081-9085 |
| Loki sin logs | Promtail no encuentra la carpeta `logs/` | Cada MS debe generar logs en `logs/` (ver logback-spring.xml) |
| Alertas no aparecen | `alerts.yml` no configurado en Prometheus | Verificar `rule_files` en `prometheus.yml` |
