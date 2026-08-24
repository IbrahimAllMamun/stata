#!/usr/bin/env bash
# =============================================================================
# db-backup-restore.sh — PostgreSQL backup & restore for STATA on Webuzo
#
# Usage:
#   ./db-backup-restore.sh backup              # create a timestamped backup
#   ./db-backup-restore.sh restore <file>      # restore from a .dump file
#   ./db-backup-restore.sh list                # list available backups
#   ./db-backup-restore.sh clean <days>        # delete backups older than N days
#
# Cron example (daily at 2 AM) — set via Webuzo → Cron Jobs:
#   0 2 * * * /home/<user>/public_html/stata-main/backend/db-backup-restore.sh backup >> /home/<user>/public_html/stata-main/backend/backups/cron.log 2>&1
#
# Place this file at: stata-main/backend/db-backup-restore.sh
# Make executable:    chmod +x db-backup-restore.sh
# =============================================================================

set -euo pipefail

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
BACKUP_DIR="${SCRIPT_DIR}/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

# ── Colours (auto-disabled when running in cron / no TTY) ─────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
  CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; BOLD=''; RESET=''
fi

info()    { echo "[INFO]  $*"; }
success() { echo "[OK]    $*"; }
warn()    { echo "[WARN]  $*"; }
error()   { echo "[ERROR] $*" >&2; }
die()     { error "$*"; exit 1; }

# ── Find PostgreSQL binaries ───────────────────────────────────────────────────
# Webuzo installs PostgreSQL under /usr/pgsql-XX/bin — this is NOT in the default
# PATH for cron jobs, so we detect it explicitly.
find_pg_bin() {
  # 1. Already in PATH (dev machines / some hosts)
  if command -v pg_dump &>/dev/null; then
    PG_DUMP="$(command -v pg_dump)"
    PG_RESTORE="$(command -v pg_restore)"
    PSQL="$(command -v psql)"
    info "Using pg_dump from PATH: $PG_DUMP"
    return
  fi

  # 2. Webuzo / RHEL: /usr/pgsql-<version>/bin  — pick the newest
  local best=""
  while IFS= read -r dir; do
    [[ -x "${dir}/pg_dump" ]] && best="$dir"
  done < <(ls -d /usr/pgsql-*/bin 2>/dev/null | sort -V)

  # 3. Debian / Ubuntu path
  if [[ -z "$best" ]]; then
    local deb
    for deb in $(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1); do
      [[ -x "${deb}/pg_dump" ]] && best="$deb"
    done
  fi

  [[ -n "$best" ]] || \
    die "pg_dump not found. Install postgresql-client or add PostgreSQL bin to PATH."

  PG_DUMP="${best}/pg_dump"
  PG_RESTORE="${best}/pg_restore"
  PSQL="${best}/psql"
  info "Using pg_dump from: $best"
}

# ── Load & parse DATABASE_URL ─────────────────────────────────────────────────
load_env() {
  if [[ -z "${DATABASE_URL:-}" ]]; then
    [[ -f "$ENV_FILE" ]] || die ".env not found at $ENV_FILE"
    export DATABASE_URL
    DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 \
                    | cut -d= -f2- | tr -d '"'\'')')"
    [[ -n "$DATABASE_URL" ]] || die "DATABASE_URL is empty in $ENV_FILE"
  fi
}

parse_db_url() {
  # postgresql://user:password@host:port/dbname[?params]
  local url="postgresql://stata:stata@localhost:5432/stata"
  DB_USER="$(echo "$url" | sed -E 's|.*://([^:]+):.*|\1|')"
  DB_PASS="$(echo "$url" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')"
  DB_HOST="$(echo "$url" | sed -E 's|.*@([^:/]+)[:/].*|\1|')"
  DB_PORT="$(echo "$url" | sed -E 's|.*@[^:]+:([0-9]+)/.*|\1|')"
  DB_NAME="$(echo "$url" | sed -E 's|.*/([^/?]+)(\?.*)?$|\1|')"
  DB_HOST="${DB_HOST:-localhost}"
  DB_PORT="${DB_PORT:-5432}"
  [[ -n "$DB_USER" && -n "$DB_NAME" ]] || die "Could not parse DATABASE_URL"
}

# Write ~/.pgpass so cron jobs never get a password prompt
setup_pgpass() {
  local pgpass="${HOME}/.pgpass"
  local entry="${DB_HOST}:${DB_PORT}:*:${DB_USER}:${DB_PASS}"
  touch "$pgpass"
  chmod 0600 "$pgpass"
  if ! grep -qF "${DB_HOST}:${DB_PORT}:*:${DB_USER}" "$pgpass" 2>/dev/null; then
    echo "$entry" >> "$pgpass"
  fi
}

# ── Commands ──────────────────────────────────────────────────────────────────
cmd_backup() {
  load_env
  parse_db_url
  find_pg_bin
  setup_pgpass

  mkdir -p "$BACKUP_DIR"
  local out="${BACKUP_DIR}/stata_db_${TIMESTAMP}.dump"

  info "Backing up '${DB_NAME}' on ${DB_HOST}:${DB_PORT} ..."

  # -Fc  = custom compressed format (smaller than plain SQL, works with pg_restore)
  # -Z9  = maximum compression
  PGPASSWORD="$DB_PASS" "$PG_DUMP" \
    --host="$DB_HOST"     \
    --port="$DB_PORT"     \
    --username="$DB_USER" \
    --dbname="$DB_NAME"   \
    --format=custom       \
    --compress=9          \
    --no-owner            \
    --no-acl              \
    --file="$out"

  [[ -s "$out" ]] || die "Backup file is empty — pg_dump may have failed."

  local size
  size="$(du -sh "$out" | cut -f1)"
  success "Saved: $out  ($size)"
  echo "$(date '+%Y-%m-%d %H:%M:%S')  BACKUP OK   $out  $size" >> "${BACKUP_DIR}/backup.log"
}

cmd_restore() {
  local restore_file="${1:-}"
  [[ -n "$restore_file" ]] || die "Usage: $0 restore <backup-file.dump>"
  [[ -f "$restore_file" ]] || die "File not found: $restore_file"

  load_env
  parse_db_url
  find_pg_bin
  setup_pgpass

  warn "You are about to RESTORE '${DB_NAME}' on ${DB_HOST}:${DB_PORT}."
  warn "ALL existing data will be replaced by this backup."
  echo
  read -rp "  Type 'yes' to confirm: " confirm
  [[ "$confirm" == "yes" ]] || { info "Restore cancelled."; exit 0; }

  # --clean drops each object before recreating it inside the existing database,
  # so we never need DROP DATABASE (which requires ownership we don't have on Webuzo).
  # --if-exists suppresses errors when the DB happens to be empty.
  info "Restoring from $(basename "$restore_file") ..."
  PGPASSWORD="$DB_PASS" "$PG_RESTORE" \
    --host="$DB_HOST"     \
    --port="$DB_PORT"     \
    --username="$DB_USER" \
    --dbname="$DB_NAME"   \
    --no-owner            \
    --no-acl              \
    --clean               \
    --if-exists           \
    --single-transaction  \
    --verbose             \
    "$restore_file"

  success "Restore complete. '${DB_NAME}' is ready."
  echo "$(date '+%Y-%m-%d %H:%M:%S')  RESTORE OK  $restore_file" >> "${BACKUP_DIR}/backup.log"
}

cmd_list() {
  if [[ ! -d "$BACKUP_DIR" ]] || ! ls "${BACKUP_DIR}"/*.dump &>/dev/null; then
    info "No backups found in ${BACKUP_DIR}."
    return
  fi
  echo
  echo "Backups in ${BACKUP_DIR}:"
  printf "%-52s  %8s  %s\n" "File" "Size" "Created"
  echo "───────────────────────────────────────────────────────────────────────"
  ls -t "${BACKUP_DIR}"/*.dump | while read -r f; do
    size="$(du -sh "$f" | cut -f1)"
    mtime="$(date -r "$f" '+%Y-%m-%d %H:%M')"
    printf "%-52s  %8s  %s\n" "$(basename "$f")" "$size" "$mtime"
  done
  echo
}

cmd_clean() {
  local days="${1:-}"
  [[ "$days" =~ ^[0-9]+$ ]] || die "Usage: $0 clean <days>  (e.g. 30)"
  [[ -d "$BACKUP_DIR" ]] || { info "No backup directory."; return; }
  info "Removing backups older than ${days} days ..."
  find "$BACKUP_DIR" -maxdepth 1 -name "*.dump" -mtime +"$days" -print -delete
  success "Done."
}

# ── Entry point ───────────────────────────────────────────────────────────────
COMMAND="${1:-help}"
shift || true

case "$COMMAND" in
  backup)  cmd_backup ;;
  restore) cmd_restore "${1:-}" ;;
  list)    cmd_list ;;
  clean)   cmd_clean "${1:-}" ;;
  *)
    echo
    echo "STATA — DB Backup & Restore (Webuzo / PostgreSQL)"
    echo
    echo "Commands:"
    echo "  backup              Dump the database to backups/"
    echo "  restore <file>      Restore from a .dump file"
    echo "  list                List available backups with sizes"
    echo "  clean <days>        Delete backups older than N days"
    echo
    echo "Cron setup (Webuzo panel → Cron Jobs):"
    echo "  Minute: 0  Hour: 2  Day/Month/Weekday: *"
    echo "  Command:"
    echo "    /home/<user>/public_html/stata-main/backend/db-backup-restore.sh backup >> /home/<user>/public_html/stata-main/backend/backups/cron.log 2>&1"
    echo
    ;;
esac