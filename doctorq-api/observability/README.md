# 📊 Sistema de Observabilidade - DoctorQ API

Sistema completo de monitoramento e métricas usando **Prometheus + Grafana**.

## 🎯 UC116 - Métricas de Performance

Este sistema implementa observabilidade completa da API DoctorQ com:

- ✅ Métricas APM (Application Performance Monitoring)
- ✅ Métricas de infraestrutura (CPU, memória, disco)
- ✅ Métricas de banco de dados (PostgreSQL)
- ✅ Métricas de cache (Redis)
- ✅ Alertas automáticos (email, Slack, etc)
- ✅ Dashboards visuais no Grafana

## 🚀 Quick Start

### 1. Iniciar Stack de Observabilidade

```bash
# Subir Prometheus + Grafana + Exporters
cd /mnt/repositorios/DoctorQ/estetiQ-api
docker-compose -f docker-compose.observability.yml up -d

# Verificar status
docker-compose -f docker-compose.observability.yml ps
```

### 2. Acessar Interfaces

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
  - **Usuário**: admin
  - **Senha**: admin (altere no primeiro acesso)

### 3. Métricas da API

As métricas da API DoctorQ estão expostas em:

```
http://localhost:8080/metrics
```

**Exemplo de métricas disponíveis:**

```
# HELP doctorq_http_requests_total Total de requisições HTTP recebidas
# TYPE doctorq_http_requests_total counter
doctorq_http_requests_total{endpoint="/users/",method="GET",status_code="200"} 1234

# HELP doctorq_http_request_duration_seconds Duração das requisições HTTP em segundos
# TYPE doctorq_http_request_duration_seconds histogram
doctorq_http_request_duration_seconds_bucket{endpoint="/users/",method="GET",le="0.05"} 980
doctorq_http_request_duration_seconds_bucket{endpoint="/users/",method="GET",le="0.1"} 1200
doctorq_http_request_duration_seconds_sum{endpoint="/users/",method="GET"} 45.3
doctorq_http_request_duration_seconds_count{endpoint="/users/",method="GET"} 1234
```

## 📈 Métricas Disponíveis

### Métricas HTTP

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `doctorq_http_requests_total` | Counter | Total de requisições HTTP por endpoint/método/status |
| `doctorq_http_request_duration_seconds` | Histogram | Latência de requisições (P50, P95, P99) |
| `doctorq_http_errors_total` | Counter | Total de erros HTTP 5xx |
| `doctorq_http_requests_in_progress` | Gauge | Requisições em andamento (concorrência) |
| `doctorq_http_requests_authenticated_total` | Counter | Requisições autenticadas vs não autenticadas |
| `doctorq_http_response_size_bytes` | Histogram | Tamanho das respostas HTTP |

### Métricas de Sistema

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `doctorq_memory_usage_bytes` | Gauge | Uso de memória da aplicação |
| `doctorq_cpu_usage_percent` | Gauge | Uso de CPU da aplicação |

### Métricas de Banco de Dados

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `doctorq_database_connections_total` | Counter | Conexões ao banco (sucesso/erro) |
| `doctorq_database_query_duration_seconds` | Histogram | Duração de queries SQL por operação |

### Métricas de Cache

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `doctorq_cache_operations_total` | Counter | Operações de cache (hit/miss/error) |

## 🔔 Alertas Configurados

Os seguintes alertas estão pré-configurados em `alerts.yml`:

### Alertas Críticos (🔴 CRITICAL)

- **HighErrorRate**: Taxa de erros 5xx > 5% por 5 minutos
- **VeryHighLatencyP95**: Latência P95 > 5 segundos por 2 minutos
- **CriticalMemoryUsage**: Uso de memória > 4 GB por 2 minutos
- **ServiceDown**: API indisponível por 1 minuto
- **DatabaseDown**: PostgreSQL indisponível por 1 minuto
- **LowDatabaseConnectionSuccessRate**: < 95% de conexões bem-sucedidas

### Alertas de Atenção (🟡 WARNING)

- **HighLatencyP95**: Latência P95 > 2 segundos por 5 minutos
- **HighMemoryUsage**: Uso de memória > 2 GB por 5 minutos
- **HighCPUUsage**: Uso de CPU > 80% por 10 minutos
- **TooManyRequestsInProgress**: > 100 requisições simultâneas por 5 minutos
- **SlowSQLQueries**: Queries SQL P95 > 1 segundo por 5 minutos
- **RedisDown**: Redis indisponível por 2 minutos

### Alertas Informativos (🔵 INFO)

- **LowCacheHitRate**: Taxa de cache hit < 50% por 10 minutos

## 📊 Dashboards Grafana

### Dashboard Principal

Acesse Grafana em http://localhost:3001 e navegue até:

**Dashboards → DoctorQ API Performance**

**Painéis disponíveis:**

1. **Overview**
   - Total de requisições
   - Taxa de erro
   - Latência média (P50, P95, P99)
   - Requisições por segundo (RPS)

2. **Latência**
   - Gráfico de latência por endpoint
   - Heatmap de distribuição
   - Top 10 endpoints mais lentos

3. **Erros**
   - Taxa de erro ao longo do tempo
   - Erros por endpoint
   - Erros por status code

4. **Sistema**
   - Uso de memória e CPU
   - Requisições em andamento
   - Conexões ao banco de dados

5. **Banco de Dados**
   - Latência de queries SQL
   - Conexões ativas
   - Pool de conexões

6. **Cache**
   - Taxa de cache hit/miss
   - Operações por segundo
   - Eficiência do cache

## 🔧 Configuração Avançada

### Personalizar Alertas

Edite `observability/alerts.yml` e recarregue o Prometheus:

```bash
docker-compose -f docker-compose.observability.yml restart prometheus
```

### Adicionar Novos Targets

Edite `observability/prometheus.yml` e adicione em `scrape_configs`:

```yaml
- job_name: 'my-new-service'
  static_configs:
    - targets: ['my-service:9090']
```

### Configurar Notificações

Para receber alertas por email, Slack, PagerDuty, etc:

1. Descomente seção `alertmanager` no `docker-compose.observability.yml`
2. Crie arquivo `observability/alertmanager.yml`:

```yaml
route:
  receiver: 'default-receiver'

receivers:
  - name: 'default-receiver'
    email_configs:
      - to: 'team@doctorq.app'
        from: 'alerts@doctorq.app'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@doctorq.app'
        auth_password: 'your-app-password'
```

## 📝 Queries PromQL Úteis

### Latência P95 por Endpoint

```promql
histogram_quantile(0.95,
  sum(rate(doctorq_http_request_duration_seconds_bucket[5m])) by (le, endpoint)
)
```

### Taxa de Erro

```promql
sum(rate(doctorq_http_errors_total[5m]))
/
sum(rate(doctorq_http_requests_total[5m]))
```

### Top 10 Endpoints Mais Acessados

```promql
topk(10,
  sum(rate(doctorq_http_requests_total[1h])) by (endpoint)
)
```

### Taxa de Cache Hit

```promql
sum(rate(doctorq_cache_operations_total{operation="get",status="hit"}[5m]))
/
sum(rate(doctorq_cache_operations_total{operation="get"}[5m]))
```

## 🛠️ Troubleshooting

### Prometheus não está coletando métricas

```bash
# Verificar se API está expondo /metrics
curl http://localhost:8080/metrics

# Verificar logs do Prometheus
docker logs doctorq-prometheus

# Verificar targets no Prometheus
# Acesse: http://localhost:9090/targets
```

### Grafana não está mostrando dados

```bash
# Verificar data source do Prometheus
# Grafana → Configuration → Data Sources → Prometheus

# URL deve ser: http://prometheus:9090
```

### Alertas não estão disparando

```bash
# Verificar regras no Prometheus
# Acesse: http://localhost:9090/alerts

# Verificar logs do Alertmanager
docker logs doctorq-alertmanager
```

## 📚 Recursos Adicionais

- [Documentação Prometheus](https://prometheus.io/docs/)
- [Documentação Grafana](https://grafana.com/docs/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)

## 🤝 Contribuindo

Para adicionar novas métricas customizadas:

1. Defina a métrica em `src/middleware/metrics_middleware.py`
2. Instrumente o código usando a métrica
3. Documente neste README
4. Adicione ao dashboard do Grafana

**Exemplo:**

```python
from src.middleware.metrics_middleware import Counter

my_custom_metric = Counter(
    'doctorq_my_custom_metric_total',
    'Descrição da métrica',
    ['label1', 'label2']
)

# No código:
my_custom_metric.labels(label1='value1', label2='value2').inc()
```

---

**Implementado em:** 07/11/2025
**UC:** UC116 - Métricas de Performance
**Versão:** 1.0.0
