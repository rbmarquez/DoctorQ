#!/bin/bash
#
# Script de Backup PostgreSQL - DoctorQ
# UC125 - Backup e Restauração (Disaster Recovery)
#
# Uso:
#   ./scripts/backup_database.sh [full|incremental]
#
# Variáveis de ambiente necessárias:
#   - PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
#   - BACKUP_DIR (diretório de destino)
#   - S3_BUCKET (opcional - para upload para S3/MinIO)

set -e  # Parar em caso de erro

# ========== Configurações ==========

BACKUP_TYPE="${1:-full}"  # full ou incremental
BACKUP_DIR="${BACKUP_DIR:-/var/backups/doctorq/database}"
RETENTION_DAYS_DAILY=30
RETENTION_DAYS_WEEKLY=365
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)
HOSTNAME="${PGHOST:-localhost}"
PORT="${PGPORT:-5432}"
DATABASE="${PGDATABASE:-dbdoctorq}"
USER="${PGUSER:-postgres}"

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# ========== Funções ==========

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    echo "[ERROR] $*" >&2
    exit 1
}

cleanup_old_backups() {
    log "Limpando backups antigos..."

    # Remover backups diários com mais de $RETENTION_DAYS_DAILY dias
    find "$BACKUP_DIR" -name "doctorq_daily_*.sql.gz" -mtime +$RETENTION_DAYS_DAILY -delete

    # Remover backups semanais com mais de $RETENTION_DAYS_WEEKLY dias
    find "$BACKUP_DIR" -name "doctorq_weekly_*.sql.gz" -mtime +$RETENTION_DAYS_WEEKLY -delete

    log "Limpeza concluída"
}

backup_full() {
    local backup_file="$BACKUP_DIR/doctorq_full_${TIMESTAMP}.sql.gz"

    log "Iniciando backup FULL do banco de dados '$DATABASE'..."
    log "Host: $HOSTNAME:$PORT"
    log "Arquivo: $backup_file"

    # Exportar senha para pg_dump
    export PGPASSWORD

    # Fazer backup com pg_dump
    if pg_dump -h "$HOSTNAME" -p "$PORT" -U "$USER" -d "$DATABASE" \
        --format=custom \
        --compress=9 \
        --verbose \
        --file="$backup_file" 2>&1 | tee -a "$BACKUP_DIR/backup_${TIMESTAMP}.log"; then

        log "Backup FULL concluído com sucesso!"

        # Obter tamanho do arquivo
        local size=$(du -h "$backup_file" | cut -f1)
        log "Tamanho do backup: $size"

        # Gerar checksum MD5
        md5sum "$backup_file" > "${backup_file}.md5"
        log "Checksum MD5 gerado"

        # Upload para S3/MinIO (se configurado)
        if [ -n "$S3_BUCKET" ]; then
            upload_to_s3 "$backup_file"
        fi

        return 0
    else
        error "Falha ao realizar backup FULL"
    fi
}

backup_incremental() {
    # Para backups incrementais, usamos WAL (Write-Ahead Logging)
    # Requer configuração prévia de archiving no PostgreSQL

    local backup_file="$BACKUP_DIR/doctorq_incremental_${TIMESTAMP}.tar.gz"
    local wal_dir="/var/lib/postgresql/14/main/pg_wal"  # Ajustar conforme instalação

    log "Iniciando backup INCREMENTAL (WAL archiving)..."

    if [ ! -d "$wal_dir" ]; then
        log "WAL archiving não configurado. Fazendo backup FULL ao invés de incremental."
        backup_full
        return
    fi

    # Arquivar WAL files
    tar -czf "$backup_file" -C "$wal_dir" .

    log "Backup INCREMENTAL concluído!"

    # Upload para S3/MinIO
    if [ -n "$S3_BUCKET" ]; then
        upload_to_s3 "$backup_file"
    fi
}

upload_to_s3() {
    local file="$1"
    local filename=$(basename "$file")
    local s3_path="s3://${S3_BUCKET}/doctorq/database/${DATE}/${filename}"

    log "Fazendo upload para S3: $s3_path"

    if command -v aws &> /dev/null; then
        aws s3 cp "$file" "$s3_path" --storage-class GLACIER
        aws s3 cp "${file}.md5" "${s3_path}.md5" --storage-class GLACIER
        log "Upload para S3 concluído!"
    elif command -v mc &> /dev/null; then
        # MinIO Client
        mc cp "$file" "minio/${S3_BUCKET}/doctorq/database/${DATE}/${filename}"
        mc cp "${file}.md5" "minio/${S3_BUCKET}/doctorq/database/${DATE}/${filename}.md5"
        log "Upload para MinIO concluído!"
    else
        log "AVISO: aws-cli ou mc (MinIO) não encontrado. Backup apenas local."
    fi
}

send_notification() {
    local status="$1"
    local message="$2"

    # Enviar notificação (email, Slack, etc)
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"Backup DoctorQ - $status: $message\"}" \
            || true
    fi
}

# ========== Execução Principal ==========

log "========================================="
log "Backup DoctorQ Database - Tipo: $BACKUP_TYPE"
log "========================================="

# Verificar se PostgreSQL está acessível
if ! pg_isready -h "$HOSTNAME" -p "$PORT" -U "$USER" > /dev/null 2>&1; then
    error "PostgreSQL não está acessível em $HOSTNAME:$PORT"
fi

log "PostgreSQL está acessível"

# Executar backup
case "$BACKUP_TYPE" in
    full)
        if backup_full; then
            send_notification "SUCCESS" "Backup FULL concluído com sucesso"
            cleanup_old_backups
            exit 0
        else
            send_notification "ERROR" "Falha no backup FULL"
            exit 1
        fi
        ;;
    incremental)
        if backup_incremental; then
            send_notification "SUCCESS" "Backup INCREMENTAL concluído"
            exit 0
        else
            send_notification "ERROR" "Falha no backup INCREMENTAL"
            exit 1
        fi
        ;;
    *)
        error "Tipo de backup inválido: $BACKUP_TYPE (use 'full' ou 'incremental')"
        ;;
esac
