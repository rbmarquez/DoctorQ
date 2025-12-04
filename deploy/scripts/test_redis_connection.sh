#!/bin/bash
# =============================================================================
# Script de Teste de Conexão Redis - DoctorQ
# =============================================================================
# Verifica se Redis está funcionando corretamente
# Data: 25/11/2025
# =============================================================================

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Teste de Conexão Redis - DoctorQ${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Contador de testes
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Função para testar e reportar
test_command() {
    local test_name="$1"
    local command="$2"
    local expected="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "  [$TOTAL_TESTS] $test_name... "

    result=$(eval "$command" 2>&1)

    if echo "$result" | grep -q "$expected"; then
        echo -e "${GREEN}✅ OK${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FALHOU${NC}"
        echo -e "     ${YELLOW}Resultado: $result${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Ler senha do Redis
REDIS_PASSWORD=""
if [ -f /tmp/redis_password.txt ]; then
    REDIS_PASSWORD=$(cat /tmp/redis_password.txt)
    echo -e "${GREEN}✅ Senha lida de /tmp/redis_password.txt${NC}"
elif [ ! -z "$REDIS_PASSWORD_ENV" ]; then
    REDIS_PASSWORD="$REDIS_PASSWORD_ENV"
    echo -e "${GREEN}✅ Senha lida da variável de ambiente${NC}"
else
    echo -e "${YELLOW}⚠️  Senha não encontrada${NC}"
    read -sp "Digite a senha do Redis: " REDIS_PASSWORD
    echo ""
fi

# Verificar se Redis está instalado
echo ""
echo -e "${YELLOW}Verificando instalação...${NC}"
if ! command -v redis-server &> /dev/null; then
    echo -e "${RED}❌ Redis não está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Redis instalado: $(redis-server --version)${NC}"

# Verificar se Redis está rodando
echo ""
echo -e "${YELLOW}Verificando serviço...${NC}"
if systemctl is-active --quiet redis; then
    echo -e "${GREEN}✅ Redis está rodando${NC}"
    systemctl status redis --no-pager | grep "Active:" | head -1
else
    echo -e "${RED}❌ Redis não está rodando${NC}"
    echo "Execute: sudo systemctl start redis"
    exit 1
fi

# Testes de conexão
echo ""
echo -e "${YELLOW}Executando testes de conexão:${NC}"

# Teste 1: PING
test_command "PING básico" "redis-cli -a '$REDIS_PASSWORD' PING" "PONG"

# Teste 2: SET/GET
test_command "SET test_key" "redis-cli -a '$REDIS_PASSWORD' SET test_key 'test_value'" "OK"
test_command "GET test_key" "redis-cli -a '$REDIS_PASSWORD' GET test_key" "test_value"
test_command "DEL test_key" "redis-cli -a '$REDIS_PASSWORD' DEL test_key" "1"

# Teste 3: Tipos de dados
test_command "SET string" "redis-cli -a '$REDIS_PASSWORD' SET mystring 'hello'" "OK"
test_command "INCR counter" "redis-cli -a '$REDIS_PASSWORD' SET counter 0 && redis-cli -a '$REDIS_PASSWORD' INCR counter" "1"
test_command "LPUSH list" "redis-cli -a '$REDIS_PASSWORD' LPUSH mylist 'item1'" "1"
test_command "SADD set" "redis-cli -a '$REDIS_PASSWORD' SADD myset 'member1'" "1"
test_command "HSET hash" "redis-cli -a '$REDIS_PASSWORD' HSET myhash field1 'value1'" "1"

# Limpar dados de teste
redis-cli -a "$REDIS_PASSWORD" DEL mystring counter mylist myset myhash > /dev/null 2>&1

# Teste 4: TTL (Time To Live)
test_command "SETEX com TTL" "redis-cli -a '$REDIS_PASSWORD' SETEX temp_key 10 'expires'" "OK"
test_command "TTL verificação" "redis-cli -a '$REDIS_PASSWORD' TTL temp_key" "[0-9]"
redis-cli -a "$REDIS_PASSWORD" DEL temp_key > /dev/null 2>&1

# Informações do servidor
echo ""
echo -e "${YELLOW}Informações do servidor:${NC}"
echo ""

echo -e "${BLUE}📊 Versão:${NC}"
redis-cli -a "$REDIS_PASSWORD" INFO server 2>&1 | grep -E "redis_version|os|arch_bits" | sed 's/^/  /'

echo ""
echo -e "${BLUE}💾 Memória:${NC}"
redis-cli -a "$REDIS_PASSWORD" INFO memory 2>&1 | grep -E "used_memory_human|used_memory_peak_human|maxmemory_human|maxmemory_policy" | sed 's/^/  /'

echo ""
echo -e "${BLUE}📈 Estatísticas:${NC}"
redis-cli -a "$REDIS_PASSWORD" INFO stats 2>&1 | grep -E "total_connections_received|total_commands_processed|instantaneous_ops_per_sec|keyspace_hits|keyspace_misses" | sed 's/^/  /'

echo ""
echo -e "${BLUE}💿 Persistência:${NC}"
redis-cli -a "$REDIS_PASSWORD" INFO persistence 2>&1 | grep -E "rdb_last_save_time|aof_enabled|aof_last_rewrite_time_sec" | sed 's/^/  /'

echo ""
echo -e "${BLUE}🔌 Clientes Conectados:${NC}"
redis-cli -a "$REDIS_PASSWORD" INFO clients 2>&1 | grep -E "connected_clients|blocked_clients" | sed 's/^/  /'

echo ""
echo -e "${BLUE}🗂️  Keyspace (Databases):${NC}"
KEYSPACE=$(redis-cli -a "$REDIS_PASSWORD" INFO keyspace 2>&1)
if echo "$KEYSPACE" | grep -q "^db"; then
    echo "$KEYSPACE" | grep "^db" | sed 's/^/  /'
else
    echo "  ${YELLOW}Nenhuma chave armazenada${NC}"
fi

# Teste de performance (opcional)
echo ""
echo -e "${YELLOW}Teste de performance (10000 operações):${NC}"
redis-benchmark -a "$REDIS_PASSWORD" -t set,get -n 10000 -q 2>&1 | sed 's/^/  /'

# Verificar configurações importantes
echo ""
echo -e "${YELLOW}Configurações importantes:${NC}"
echo ""
echo -e "${BLUE}Senha configurada:${NC}"
if redis-cli -a "$REDIS_PASSWORD" CONFIG GET requirepass 2>&1 | grep -q "$REDIS_PASSWORD"; then
    echo -e "  ${GREEN}✅ Sim (segurança habilitada)${NC}"
else
    echo -e "  ${RED}❌ Não (INSEGURO!)${NC}"
fi

echo ""
echo -e "${BLUE}Bind address:${NC}"
redis-cli -a "$REDIS_PASSWORD" CONFIG GET bind 2>&1 | grep -v "^bind$" | sed 's/^/  /'

echo ""
echo -e "${BLUE}Maxmemory:${NC}"
redis-cli -a "$REDIS_PASSWORD" CONFIG GET maxmemory 2>&1 | grep -v "^maxmemory$" | sed 's/^/  /'

echo ""
echo -e "${BLUE}Maxmemory policy:${NC}"
redis-cli -a "$REDIS_PASSWORD" CONFIG GET maxmemory-policy 2>&1 | grep -v "^maxmemory-policy$" | sed 's/^/  /'

# Resumo final
echo ""
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Resumo dos Testes${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "  ${BLUE}Total de testes:${NC} $TOTAL_TESTS"
echo -e "  ${GREEN}Testes passados:${NC} $PASSED_TESTS"
echo -e "  ${RED}Testes falhados:${NC} $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ Todos os testes passaram! Redis está funcionando perfeitamente.${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Alguns testes falharam. Verifique os logs acima.${NC}"
    echo ""
    echo -e "${YELLOW}Comandos úteis para debug:${NC}"
    echo "  - Ver logs: sudo tail -f /var/log/redis/redis.log"
    echo "  - Status: sudo systemctl status redis"
    echo "  - Reiniciar: sudo systemctl restart redis"
    echo ""
    exit 1
fi
