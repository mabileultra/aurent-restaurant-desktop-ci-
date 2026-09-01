#!/usr/bin/env bash
# Резервные копии PostgreSQL (gzip): создание, восстановление, ежедневный cron.
# Использование:
#   bash deploy/backup.sh                        — создать бэкап
#   bash deploy/backup.sh restore <файл.sql.gz>  — восстановить (ОСТОРОЖНО: перезаписывает БД)
#   sudo bash deploy/backup.sh install-cron      — ежедневный бэкап в 03:00 (Asia/Tashkent на сервере)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
SUBCOMMAND="${1:-create}"

# --- .env: безопасная загрузка (только строки KEY=VALUE, без выполнения мусора) ---
load_dotenv() {
  local file="${1:-.env}"
  local line key val
  if [[ ! -f "$file" ]]; then
    echo "Нет файла $file" >&2
    return 1
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "${line//[[:space:]]/}" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      val="${BASH_REMATCH[2]}"
      if [[ "$val" =~ ^\"(.*)\"$ ]]; then
        val="${BASH_REMATCH[1]}"
      elif [[ "$val" =~ ^\'(.*)\'$ ]]; then
        val="${BASH_REMATCH[1]}"
      fi
      printf -v "$key" '%s' "$val"
      export "$key"
    else
      echo "WARN: пропуск неверной строки в ${file}: ${line:0:48}" >&2
    fi
  done < "$file"
}

compose() {
  if [[ -f "$ENV_FILE" ]]; then
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
  else
    docker compose -f "$COMPOSE_FILE" "$@"
  fi
}

cmd_create() {
  local backup_dir="${BACKUP_DIR:-$ROOT/backups/postgres}"
  local retention_days="${RETENTION_DAYS:-14}"

  if [[ ! -f "$ENV_FILE" ]]; then
    echo "backup: нет $ENV_FILE"
    exit 1
  fi
  load_dotenv "$ENV_FILE"

  local pg_user="${POSTGRES_USER:-pos_user}"
  local pg_db="${POSTGRES_DB:-pos_db}"

  if ! compose exec -T postgres pg_isready -U "$pg_user" -d "$pg_db" >/dev/null 2>&1; then
    echo "backup: PostgreSQL не готов"
    exit 1
  fi

  mkdir -p "$backup_dir"
  local stamp out size deleted
  stamp="$(date +%Y%m%d_%H%M%S)"
  out="$backup_dir/pos_db_${stamp}.sql.gz"

  echo "==> pg_dump → $out"
  compose exec -T postgres pg_dump \
    -U "$pg_user" \
    -d "$pg_db" \
    --no-owner \
    --no-acl \
    | gzip -9 >"$out"

  size="$(du -h "$out" | awk '{print $1}')"
  echo "==> Готово: $out ($size)"

  if [[ "$retention_days" -gt 0 ]]; then
    deleted="$(find "$backup_dir" -maxdepth 1 -name 'pos_db_*.sql.gz' -mtime +"$retention_days" -print -delete | wc -l | tr -d ' ')"
    echo "==> Удалено старых бэкапов (>${retention_days} дн.): $deleted"
  fi
}

cmd_restore() {
  local dump="${1:-}"
  if [[ -z "$dump" ]]; then
    echo "Использование: bash deploy/backup.sh restore <путь-к-pos_db_*.sql.gz>"
    exit 1
  fi
  if [[ ! -f "$dump" ]]; then
    echo "Файл не найден: $dump"
    exit 1
  fi

  load_dotenv "$ENV_FILE"

  local pg_user="${POSTGRES_USER:-pos_user}"
  local pg_db="${POSTGRES_DB:-pos_db}"

  echo "==> Останов backend (чтобы не писал в БД во время restore)..."
  compose stop backend 2>/dev/null || true

  echo "==> Восстановление из $dump"
  gunzip -c "$dump" | compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$pg_user" -d "$pg_db"

  echo "==> Запуск backend..."
  compose up -d backend

  echo "==> Готово. Проверьте: curl -s http://localhost:8080/api/v1/actuator/health"
}

cmd_verify_latest() {
  local backup_dir="${BACKUP_DIR:-$ROOT/backups/postgres}"
  if [[ ! -d "$backup_dir" ]]; then
    echo "backup verify: нет каталога $backup_dir"
    exit 1
  fi
  local latest
  latest="$(find "$backup_dir" -maxdepth 1 -name 'pos_db_*.sql.gz' -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)"
  if [[ -z "$latest" ]]; then
    echo "backup verify: файлов pos_db_*.sql.gz не найдено"
    exit 1
  fi
  echo "==> Проверка gzip: $latest"
  gzip -t "$latest"
  local size
  size="$(du -h "$latest" | awk '{print $1}')"
  echo "==> OK ($size)"
}

cmd_install_cron() {
  local cron_line="0 3 * * * cd $ROOT && /usr/bin/bash deploy/backup.sh >> $ROOT/backups/postgres/backup.log 2>&1"

  mkdir -p "$ROOT/backups/postgres"

  local tmp
  tmp="$(mktemp)"
  crontab -l 2>/dev/null | grep -v 'deploy/backup' >"$tmp" || true
  echo "$cron_line" >>"$tmp"
  crontab "$tmp"
  rm -f "$tmp"

  echo "==> Cron установлен:"
  crontab -l | grep 'deploy/backup'
  echo ""
  echo "Проверка вручную: bash deploy/backup.sh"
  echo "Логи cron: $ROOT/backups/postgres/backup.log"
}

case "$SUBCOMMAND" in
  create)
    cmd_create
    ;;
  restore)
    shift || true
    cmd_restore "${1:-}"
    ;;
  install-cron)
    cmd_install_cron
    ;;
  verify-latest)
    cmd_verify_latest
    ;;
  *)
    echo "Использование: bash deploy/backup.sh [create|restore <файл>|install-cron|verify-latest]" >&2
    exit 1
    ;;
esac
