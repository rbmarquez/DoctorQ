#!/bin/bash
# =============================================================================
# Script de Instalação do Redis na EC2 - DoctorQ
# =============================================================================
# Instala e configura Redis 7.x no Amazon Linux 2
# Data: 25/11/2025
# =============================================================================

set -e

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Instalação do Redis - DoctorQ${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Este script precisa ser executado com sudo${NC}"
    echo "Execute: sudo bash $0"
    exit 1
fi

# Função para gerar senha forte
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# 1. Verificar se Redis já está instalado
echo -e "${YELLOW}1. Verificando instalação existente...${NC}"
if command -v redis-server &> /dev/null; then
    echo -e "${YELLOW}⚠️  Redis já está instalado${NC}"
    redis-server --version
    read -p "Deseja reconfigurar? (s/n): " RECONFIG
    if [ "$RECONFIG" != "s" ]; then
        echo "Instalação cancelada"
        exit 0
    fi
else
    echo -e "${GREEN}✅ Redis não instalado, procedendo com instalação${NC}"
fi

# 2. Atualizar sistema
echo ""
echo -e "${YELLOW}2. Atualizando sistema...${NC}"
yum update -y

# 3. Instalar Redis
echo ""
echo -e "${YELLOW}3. Instalando Redis 7.x...${NC}"
if amazon-linux-extras list | grep -q redis6; then
    amazon-linux-extras install redis6 -y
    echo -e "${GREEN}✅ Redis 6.x instalado (versão disponível no Amazon Linux)${NC}"
else
    yum install redis -y
    echo -e "${GREEN}✅ Redis instalado${NC}"
fi

# Verificar instalação
redis-server --version

# 4. Gerar senha forte
echo ""
echo -e "${YELLOW}4. Gerando senha de segurança...${NC}"
REDIS_PASSWORD=$(generate_password)
echo -e "${GREEN}✅ Senha gerada: ${REDIS_PASSWORD}${NC}"
echo ""
echo -e "${RED}⚠️  IMPORTANTE: Anote esta senha! Você precisará dela no .env${NC}"
echo -e "${BLUE}REDIS_PASSWORD=${REDIS_PASSWORD}${NC}"
echo ""

# Salvar senha em arquivo temporário
echo "$REDIS_PASSWORD" > /tmp/redis_password.txt
chmod 600 /tmp/redis_password.txt
echo -e "${GREEN}Senha também salva em: /tmp/redis_password.txt${NC}"

# 5. Configurar Redis
echo ""
echo -e "${YELLOW}5. Configurando Redis...${NC}"

# Backup da configuração original
cp /etc/redis.conf /etc/redis.conf.backup.$(date +%Y%m%d_%H%M%S)

# Aplicar configurações
cat >> /etc/redis.conf << EOF

# =============================================================================
# Configurações DoctorQ - $(date +%Y-%m-%d)
# =============================================================================

# Segurança: Senha obrigatória
requirepass $REDIS_PASSWORD

# Bind apenas localhost (não expor para internet)
bind 127.0.0.1 ::1

# Porta padrão
port 6379

# Política de memória (remover chaves menos usadas quando atingir limite)
maxmemory 256mb
maxmemory-policy allkeys-lru

# Logs
loglevel notice
logfile /var/log/redis/redis.log

# Persistência (snapshot)
save 900 1
save 300 10
save 60 10000

# AOF (Append Only File) para durabilidade
appendonly yes
appendfilename "appendonly.aof"

# Timeout de conexões ociosas (5 minutos)
timeout 300

# Banco de dados (padrão: 16 databases)
databases 16
EOF

echo -e "${GREEN}✅ Configurações aplicadas${NC}"

# 6. Criar diretório de logs
echo ""
echo -e "${YELLOW}6. Criando diretório de logs...${NC}"
mkdir -p /var/log/redis
chown redis:redis /var/log/redis
chmod 755 /var/log/redis
echo -e "${GREEN}✅ Diretório criado: /var/log/redis${NC}"

# 7. Iniciar Redis
echo ""
echo -e "${YELLOW}7. Iniciando Redis...${NC}"
systemctl start redis
systemctl enable redis

sleep 2

if systemctl is-active --quiet redis; then
    echo -e "${GREEN}✅ Redis iniciado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao iniciar Redis${NC}"
    systemctl status redis
    exit 1
fi

# 8. Testar conexão
echo ""
echo -e "${YELLOW}8. Testando conexão...${NC}"

# Teste sem autenticação (deve falhar)
if redis-cli ping 2>&1 | grep -q "NOAUTH"; then
    echo -e "${GREEN}✅ Autenticação funcionando (senha obrigatória)${NC}"
fi

# Teste com autenticação
if redis-cli -a "$REDIS_PASSWORD" ping 2>&1 | grep -q "PONG"; then
    echo -e "${GREEN}✅ Conexão autenticada funcionando${NC}"
else
    echo -e "${RED}❌ Erro na conexão autenticada${NC}"
    exit 1
fi

# Teste SET/GET
redis-cli -a "$REDIS_PASSWORD" SET test_key "DoctorQ Redis OK" > /dev/null 2>&1
TEST_VALUE=$(redis-cli -a "$REDIS_PASSWORD" GET test_key 2>&1)
if [ "$TEST_VALUE" == "DoctorQ Redis OK" ]; then
    echo -e "${GREEN}✅ Operações SET/GET funcionando${NC}"
    redis-cli -a "$REDIS_PASSWORD" DEL test_key > /dev/null 2>&1
else
    echo -e "${RED}❌ Erro nas operações SET/GET${NC}"
    exit 1
fi

# 9. Verificar status
echo ""
echo -e "${YELLOW}9. Status final do Redis:${NC}"
systemctl status redis --no-pager | head -10

# 10. Informações de memória
echo ""
echo -e "${YELLOW}10. Informações de memória:${NC}"
redis-cli -a "$REDIS_PASSWORD" INFO memory 2>&1 | grep -E "used_memory_human|maxmemory_human|maxmemory_policy"

# 11. Resumo final
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}✅ Instalação Concluída com Sucesso!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${BLUE}📋 Informações importantes:${NC}"
echo ""
echo -e "  ${YELLOW}Redis Host:${NC} localhost"
echo -e "  ${YELLOW}Redis Port:${NC} 6379"
echo -e "  ${YELLOW}Redis Password:${NC} ${RED}${REDIS_PASSWORD}${NC}"
echo -e "  ${YELLOW}Arquivo de senha:${NC} /tmp/redis_password.txt"
echo ""
echo -e "${BLUE}📝 Próximos passos:${NC}"
echo ""
echo "1. ${YELLOW}Atualizar .env da API${NC} em /home/ec2-user/DoctorQ/estetiQ-api/.env:"
echo ""
echo "   ${GREEN}REDIS_HOST=localhost${NC}"
echo "   ${GREEN}REDIS_PORT=6379${NC}"
echo "   ${GREEN}REDIS_PASSWORD=${REDIS_PASSWORD}${NC}"
echo "   ${GREEN}REDIS_DB=0${NC}"
echo "   ${GREEN}REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379/0${NC}"
echo ""
echo "2. ${YELLOW}Reiniciar API:${NC}"
echo "   ${GREEN}pm2 restart doctorq-api${NC}"
echo ""
echo "3. ${YELLOW}Verificar logs:${NC}"
echo "   ${GREEN}pm2 logs doctorq-api --lines 50${NC}"
echo ""
echo "4. ${YELLOW}Testar conexão:${NC}"
echo "   ${GREEN}redis-cli -a '${REDIS_PASSWORD}' ping${NC}"
echo ""
echo -e "${RED}⚠️  IMPORTANTE: Remova o arquivo /tmp/redis_password.txt após configurar o .env${NC}"
echo ""
