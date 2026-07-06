#!/bin/bash
# ============================================================
# EL ARCA — Backup Automatizado
# Respaldo de base de datos + storage de Supabase
# Ejecutar: bash scripts/backup.sh
# Programar en cron: 0 3 * * * /path/to/scripts/backup.sh
# ============================================================
set -euo pipefail

PROJECT_REF="ukpoprkdgezgxlkjjuve"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
RETENTION_DAYS="${RETENTION_DAYS:-30}"
LOG_FILE="${BACKUP_DIR}/backup.log"

mkdir -p "${BACKUP_DIR}/db" "${BACKUP_DIR}/storage"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

log "=== Iniciando backup de El Arca ==="

# ─── 1. Backup de base de datos via pg_dump ───
log "→ Respaldo de base de datos..."
if command -v pg_dump &>/dev/null; then
  DB_URL="${SUPABASE_DB_URL:-}"
  if [ -z "$DB_URL" ]; then
    log "  ⚠️  SUPABASE_DB_URL no definida, usando conexión desde Supabase CLI"
    DB_URL=$(supabase status --output json 2>/dev/null | grep -o '"db_url":"[^"]*"' | cut -d'"' -f4 || true)
  fi

  if [ -n "$DB_URL" ]; then
    pg_dump "${DB_URL}" \
      --no-owner --no-acl \
      --file="${BACKUP_DIR}/db/elarca-db-${DATE}.sql" \
      2>>"${LOG_FILE}"
    gzip "${BACKUP_DIR}/db/elarca-db-${DATE}.sql"
    log "  ✅ DB: elarca-db-${DATE}.sql.gz ($(du -h "${BACKUP_DIR}/db/elarca-db-${DATE}.sql.gz" | cut -f1))"
  else
    log "  ⚠️  No se pudo obtener URL de base de datos, saltando backup DB"
  fi
else
  log "  ⚠️  pg_dump no instalado, usando Supabase CLI"
  supabase db dump --project-ref "${PROJECT_REF}" \
    --file "${BACKUP_DIR}/db/elarca-db-${DATE}.sql" \
    2>>"${LOG_FILE}" && \
    gzip "${BACKUP_DIR}/db/elarca-db-${DATE}.sql"
fi

# ─── 2. Metadata export (JSON) ───
log "→ Exportando metadata de recuerdos..."
if command -v curl &>/dev/null; then
  SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
  if [ -n "$SUPABASE_ANON_KEY" ]; then
    curl -s "https://${PROJECT_REF}.supabase.co/rest/v1/recuerdos?select=*" \
      -H "apikey: ${SUPABASE_ANON_KEY}" \
      -o "${BACKUP_DIR}/storage/recuerdos-metadata-${DATE}.json" \
      2>>"${LOG_FILE}"
    log "  ✅ Metadata exportada (${DATE})"
  fi
fi

# ─── 3. Retención: eliminar backups antiguos ───
log "→ Limpiando backups con más de ${RETENTION_DAYS} días..."
find "${BACKUP_DIR}/db" -name "*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
find "${BACKUP_DIR}/storage" -name "*.json" -mtime "+${RETENTION_DAYS}" -delete
log "  ✅ Limpieza completada"

# ─── 4. Resumen ───
DB_SIZE=$(du -sh "${BACKUP_DIR}/db" 2>/dev/null | cut -f1 || echo "0")
STORAGE_SIZE=$(du -sh "${BACKUP_DIR}/storage" 2>/dev/null | cut -f1 || echo "0")
log "=== Backup completado: DB=${DB_SIZE}, Storage=${STORAGE_SIZE} ==="
