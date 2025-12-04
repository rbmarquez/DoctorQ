"""
Middleware de Métricas Prometheus
UC116 - Métricas de Performance
"""
import time
from typing import Callable
from fastapi import FastAPI, Request, Response
from prometheus_client import Counter, Histogram, Gauge, Info, generate_latest, CONTENT_TYPE_LATEST
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.routing import Match

# ========== Métricas Prometheus ==========

# Info sobre a aplicação
app_info = Info('doctorq_api', 'Informações sobre a API DoctorQ')
app_info.info({'version': '1.0.0', 'environment': 'production'})

# Contador de requisições HTTP por endpoint, método e status
http_requests_total = Counter(
    'doctorq_http_requests_total',
    'Total de requisições HTTP recebidas',
    ['method', 'endpoint', 'status_code']
)

# Histograma de latência de requisições (em segundos)
http_request_duration_seconds = Histogram(
    'doctorq_http_request_duration_seconds',
    'Duração das requisições HTTP em segundos',
    ['method', 'endpoint'],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0, float('inf'))
)

# Contador de erros HTTP 5xx
http_errors_total = Counter(
    'doctorq_http_errors_total',
    'Total de erros HTTP 5xx',
    ['method', 'endpoint', 'status_code']
)

# Gauge de requisições em andamento
http_requests_in_progress = Gauge(
    'doctorq_http_requests_in_progress',
    'Número de requisições HTTP em andamento',
    ['method', 'endpoint']
)

# Contador de requisições autenticadas vs não autenticadas
http_requests_authenticated = Counter(
    'doctorq_http_requests_authenticated_total',
    'Total de requisições autenticadas vs não autenticadas',
    ['authenticated']
)

# Histograma de tamanho de resposta (bytes)
http_response_size_bytes = Histogram(
    'doctorq_http_response_size_bytes',
    'Tamanho das respostas HTTP em bytes',
    ['method', 'endpoint'],
    buckets=(100, 1000, 10000, 100000, 1000000, 10000000, float('inf'))
)

# Gauge de memória usada (será atualizado por health check)
memory_usage_bytes = Gauge(
    'doctorq_memory_usage_bytes',
    'Uso de memória da aplicação em bytes'
)

# Gauge de CPU usada
cpu_usage_percent = Gauge(
    'doctorq_cpu_usage_percent',
    'Uso de CPU da aplicação em percentual'
)

# Contador de conexões ao banco de dados
database_connections_total = Counter(
    'doctorq_database_connections_total',
    'Total de conexões ao banco de dados',
    ['status']  # success, error
)

# Histograma de duração de queries SQL
database_query_duration_seconds = Histogram(
    'doctorq_database_query_duration_seconds',
    'Duração de queries SQL em segundos',
    ['operation'],  # select, insert, update, delete
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, float('inf'))
)

# Contador de cache hits/misses
cache_operations_total = Counter(
    'doctorq_cache_operations_total',
    'Total de operações de cache',
    ['operation', 'status']  # operation: get|set|delete, status: hit|miss|error
)


class PrometheusMetricsMiddleware(BaseHTTPMiddleware):
    """
    Middleware para coletar métricas Prometheus de requisições HTTP
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Obter rota e método
        method = request.method
        endpoint = self.get_endpoint_path(request)

        # Incrementar requisições em andamento
        http_requests_in_progress.labels(method=method, endpoint=endpoint).inc()

        # Verificar se requisição está autenticada (header Authorization presente)
        is_authenticated = "authorization" in request.headers
        http_requests_authenticated.labels(authenticated=str(is_authenticated)).inc()

        # Medir tempo de processamento
        start_time = time.time()

        try:
            # Processar requisição
            response = await call_next(request)

            # Calcular duração
            duration = time.time() - start_time

            # Coletar métricas
            status_code = response.status_code

            # Incrementar contador total de requisições
            http_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status_code=status_code
            ).inc()

            # Registrar duração
            http_request_duration_seconds.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)

            # Registrar tamanho da resposta
            content_length = response.headers.get('content-length', 0)
            if content_length:
                http_response_size_bytes.labels(
                    method=method,
                    endpoint=endpoint
                ).observe(int(content_length))

            # Se erro 5xx, incrementar contador de erros
            if 500 <= status_code < 600:
                http_errors_total.labels(
                    method=method,
                    endpoint=endpoint,
                    status_code=status_code
                ).inc()

            return response

        except Exception as e:
            # Em caso de exceção, registrar erro 500
            duration = time.time() - start_time

            http_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status_code=500
            ).inc()

            http_request_duration_seconds.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)

            http_errors_total.labels(
                method=method,
                endpoint=endpoint,
                status_code=500
            ).inc()

            raise e

        finally:
            # Decrementar requisições em andamento
            http_requests_in_progress.labels(method=method, endpoint=endpoint).dec()

    @staticmethod
    def get_endpoint_path(request: Request) -> str:
        """
        Extrai o path template da rota (e.g., /users/{id} ao invés de /users/123)
        """
        for route in request.app.routes:
            match, _ = route.matches(request.scope)
            if match == Match.FULL:
                return route.path

        # Se não encontrou rota, retorna o path original
        return request.url.path


def setup_metrics(app: FastAPI) -> None:
    """
    Configura middleware de métricas e endpoint /metrics

    Args:
        app: Instância do FastAPI
    """
    # Adicionar middleware
    app.add_middleware(PrometheusMetricsMiddleware)

    # Adicionar endpoint /metrics
    @app.get("/metrics", include_in_schema=False)
    async def metrics():
        """
        Endpoint de métricas Prometheus

        **Não requer autenticação** - acessado por Prometheus
        """
        from starlette.responses import Response
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    # Registrar em logs
    import logging
    logger = logging.getLogger(__name__)
    logger.info("✅ Prometheus metrics middleware configurado - /metrics disponível")


# ========== Helper Functions para Métricas Customizadas ==========

def track_database_connection(status: str):
    """
    Registra tentativa de conexão ao banco de dados

    Args:
        status: 'success' ou 'error'
    """
    database_connections_total.labels(status=status).inc()


def track_database_query(operation: str, duration: float):
    """
    Registra duração de query SQL

    Args:
        operation: select, insert, update, delete
        duration: Tempo em segundos
    """
    database_query_duration_seconds.labels(operation=operation).observe(duration)


def track_cache_operation(operation: str, status: str):
    """
    Registra operação de cache

    Args:
        operation: get, set, delete
        status: hit, miss, error
    """
    cache_operations_total.labels(operation=operation, status=status).inc()


def update_system_metrics(memory_mb: float, cpu_percent: float):
    """
    Atualiza métricas de sistema (chamado pelo health check)

    Args:
        memory_mb: Uso de memória em MB
        cpu_percent: Uso de CPU em percentual (0-100)
    """
    memory_usage_bytes.set(memory_mb * 1024 * 1024)  # Converter para bytes
    cpu_usage_percent.set(cpu_percent)
