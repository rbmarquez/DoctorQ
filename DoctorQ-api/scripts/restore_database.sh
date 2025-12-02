#!/bin/bash
#
# Script de Restauração PostgreSQL - DoctorQ
# UC125 - Backup e Restauração (Disaster Recovery)
#
# Uso:
#   ./scripts/restore_database.sh <arquivo_backup>
#
# Exemplo:
#   ./scripts/restore_database.sh /var/backups/doctorq/database/doctorq_full_20251107_143000.sql.gz
#
# Variáveis de ambiente necessárias:
#   - PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE

set -e  # Parar em caso de erro

# ========== Configurações ==========

BACKUP_FILE="$1"
HOSTNAME="${PGHOST:-localhost}"
PORT="${PGPORT:-5432}"
DATABASE="${PGDATABASE:-dbdoctorq}"
USER="${PGUSER:-postgres}"
RESTORE_LOG="/tmp/doctorq_restore_$(date +%Y%m%d_%H%M%S).log"

# ========== Funções ==========

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$RESTORE_LOG"
}

error() {
    echo "[ERROR] $*" >&2 | tee -a "$RESTORE_LOG"
    exit 1
}

validate_backup_file() {
    if [ -z "$BACKUP_FILE" ]; then
        error "Uso: $0 <arquivo_backup>"
    fi

    if [ ! -f "$BACKUP_FILE" ]; then
        error "Arquivo de backup não encontrado: $BACKUP_FILE"
    fi

    log "Arquivo de backup encontrado: $BACKUP_FILE"

    # Verificar checksum MD5 se existir
    if [ -f "${BACKUP_FILE}.md5" ]; then
        log "Verificando checksum MD5..."
        if md5sum -c "${BACKUP_FILE}.md5"; then
            log "✓ Checksum MD5 válido"
        else
            error "✗ Checksum MD5 inválido! Arquivo pode estar corrompido."
        fi
    else
        log "AVISO: Arquivo .md5 não encontrado. Pulando verificação de integridade."
    fi
}

confirm_restore() {
    log "========================================="
    log "ATENÇÃO: RESTAURAÇÃO DE BANCO DE DADOS"
    log "========================================="
    log "Origem: $BACKUP_FILE"
    log "Destino: $HOSTNAME:$PORT/$DATABASE"
    log ""
    log "⚠️  ESTA OPERAÇÃO IRÁ:"
    log "   - Desconectar todos os usuários do banco"
    log "   - Apagar todos os dados existentes"
    log "   - Restaurar os dados do backup"
    log ""
    log "Esta ação NÃO PODE SER DESFEITA!"
    log ""

    read -p "Tem certeza que deseja continuar? (digite 'SIM' para confirmar): " confirm

    if [ "$confirm" != "SIM" ]; then
        log "Restauração cancelada pelo usuário"
        exit 0
    fi

    log "Confirmação recebida. Iniciando restauração..."
}

terminate_connections() {
    log "Terminando conexões ativas no banco '$DATABASE'..."

    export PGPASSWORD

    psql -h "$HOSTNAME" -p "$PORT" -U "$USER" -d postgres <<EOF
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DATABASE'
  AND pid <> pg_backend_pid();
EOF

    log "Conexões terminadas"
}

drop_and_recreate_database() {
    log "Removendo banco de dados existente..."

    export PGPASSWORD

    # Dropar banco de dados
    psql -h "$HOSTNAME" -p "$PORT" -U "$USER" -d postgres -c "DROP DATABASE IF EXISTS $DATABASE;"

    log "Criando novo banco de dados..."

    # Criar banco de dados
    psql -h "$HOSTNAME" -p "$PORT" -U "$USER" -d postgres <<EOF
CREATE DATABASE $DATABASE
    WITH
    OWNER = $USER
    ENCODING = 'UTF8'
    LC_COLLATE = 'pt_BR.UTF-8'
    LC_CTYPE = 'pt_BR.UTF-8'
    TEMPLATE = template0;
EOF

    # Criar extensões necessárias
    psql -h "$HOSTNAME" -p "$PORT" -U "$USER" -d "$DATABASE" <<EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
EOF

    log "Banco de dados criado com sucesso"
}

restore_backup() {
    log "Iniciando restauração do backup..."
    log "Arquivo: $BACKUP_FILE"
    log "Este processo pode levar vários minutos..."

    export PGPASSWORD

    # Restaurar usando pg_restore
    if pg_restore \
        -h "$HOSTNAME" \
        -p "$PORT" \
        -U "$USER" \
        -d "$DATABASE" \
        --verbose \
        --no-owner \
        --no-acl \
        "$BACKUP_FILE" 2>&1 | tee -a "$RESTORE_LOG"; then

        log "✓ Restauração concluída com sucesso!"
        return 0
    else
        error "✗ Falha na restauração"
    fi
}

verify_restore() {
    log "Verificando integridade do banco restaurado..."

    export PGPASSWORD

    # Contar tabelas
    local table_count=$(psql -h "$HOSTNAME" -p "$PORT" -U "$USER" -d "$DATABASE" -t -c "
        SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
    " | tr -d ' ')

    log "Tabelas encontradas: $table_count"

    if [ "$table_count" -gt 0 ]; then
        log "✓ Banco de dados restaurado contém $table_count tabelas"

        # Listar algumas tabelas principais
        log "Tabelas principais:"
        psql -h "$HOSTNAME" -p "$PORT" -U "$USER" -d "$DATABASE" -c "
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
            LIMIT 10;
        " | tee -a "$RESTORE_LOG"

        return 0
    else
        error "✗ Nenhuma tabela encontrada no banco restaurado"
    fi
}

create_restore_point() {
    log "Criando ponto de restauração..."

    export PGPASSWORD

    psql -h "$HOSTNAME" -p "$PORT" -U "$USER" -d "$DATABASE" -c "
        SELECT pg_create_restore_point('post_restore_$(date +%Y%m%d_%H%M%S)');
    " || log "AVISO: Não foi possível criar ponto de restauração (recurso pode não estar disponível)"
}

send_notification() {
    local status="$1"
    local message="$2"

    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"Restauração DoctorQ - $status: $message\"}" \
            || true
    fi
}

# ========== Execução Principal ==========

log "========================================="
log "Restauração DoctorQ Database"
log "========================================="

# Validar arquivo de backup
validate_backup_file

# Verificar se PostgreSQL está acessível
if ! pg_isready -h "$HOSTNAME" -p "$PORT" -U "$USER" > /dev/null 2>&1; then
    error "PostgreSQL não está acessível em $HOSTNAME:$PORT"
fi

log "PostgreSQL está acessível"

# Confirmar com usuário
confirm_restore

# Fazer backup de segurança antes de restaurar (se database existe)
if psql -h "$HOSTNAME" -p "$PORT" -U "$USER" -d postgres -lqt | cut -d \| -f 1 | grep -qw "$DATABASE"; then
    SAFETY_BACKUP="/tmp/doctorq_pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    log "Criando backup de segurança antes da restauração: $SAFETY_BACKUP"

    pg_dump -h "$HOSTNAME" -p "$PORT" -U "$USER" -d "$DATABASE" \
        --format=custom --compress=9 --file="$SAFETY_BACKUP" || \
        log "AVISO: Não foi possível criar backup de segurança"
fi

# Executar restauração
terminate_connections
drop_and_recreate_database

if restore_backup; then
    verify_restore
    create_restore_point
    send_notification "SUCCESS" "Restauração concluída com sucesso"

    log "========================================="
    log "✓ RESTAURAÇÃO CONCLUÍDA COM SUCESSO"
    log "========================================="
    log "Log completo: $RESTORE_LOG"

    exit 0
else
    send_notification "ERROR" "Falha na restauração"
    error "Falha na restauração. Verifique o log: $RESTORE_LOG"
fi
