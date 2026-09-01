#!/usr/bin/env bash
# Health + backup + disk checks with optional Telegram alerts.
# Safe to run from cron — exits 0 when healthy, 1 when issues found.
#
# Usage:
#   bash deploy/health-alert.sh              # check only
#   bash deploy/health-alert.sh install-cron # every 5 minutes
#
# Optional overrides (usually not needed — uses existing support/pharmacy bot from .env):
#   OPS_ALERT_TELEGRAM_BOT_TOKEN=
#   OPS_ALERT_TELEGRAM_CHAT_ID=
# Falls back to: TELEGRAM_WEB_SUPPORT_* then TELEGRAM_BOT_TOKEN + TELEGRAM_SUPPORT_GROUP_ID
#   OPS_ALERT_DISK_WARN_PERCENT=85
#   OPS_ALERT_BACKUP_MAX_AGE_HOURS=26
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups/postgres}"
DISK_WARN="${OPS_ALERT_DISK_WARN_PERCENT:-85}"
BACKUP_MAX_AGE_H="${OPS_ALERT_BACKUP_MAX_AGE_HOURS:-26}"

load_dotenv() {
  local file="${1:-.env}"
  [[ -f "$file" ]] || return 0
  local line key val
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "${line//[[:space:]]/}" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      val="${BASH_REMATCH[2]}"
      val="${val%\"}"; val="${val#\"}"
      val="${val%\'}"; val="${val#\'}"
      printf -v "$key" '%s' "$val"
      export "$key"
    fi
  done < "$file"
}

resolve_telegram_credentials() {
  local token="${OPS_ALERT_TELEGRAM_BOT_TOKEN:-}"
  local chat="${OPS_ALERT_TELEGRAM_CHAT_ID:-}"

  if [[ -z "$token" ]]; then
    token="${TELEGRAM_WEB_SUPPORT_BOT_TOKEN:-${TELEGRAM_BOT_TOKEN:-}}"
  fi
  if [[ -z "$chat" ]]; then
    chat="${TELEGRAM_WEB_SUPPORT_GROUP_ID:-${TELEGRAM_SUPPORT_GROUP_ID:-}}"
  fi

  printf '%s\n%s' "$token" "$chat"
}

send_telegram() {
  local text="$1"
  local creds token chat
  creds="$(resolve_telegram_credentials)"
  token="$(echo "$creds" | sed -n '1p')"
  chat="$(echo "$creds" | sed -n '2p')"
  [[ -n "$token" && -n "$chat" ]] || return 0
  curl -fsS -X POST "https://api.telegram.org/bot${token}/sendMessage" \
    -d "chat_id=${chat}" \
    --data-urlencode "text=${text}" \
    --data-urlencode "parse_mode=HTML" >/dev/null 2>&1 || true
}

issues=()

check_url() {
  local name="$1"
  local url="$2"
  if curl -fsS --max-time 8 "$url" | grep -q UP; then
    echo "OK  $name"
  else
    issues+=("$name DOWN ($url)")
    echo "FAIL $name"
  fi
}

cmd_check() {
  load_dotenv "$ENV_FILE"

  echo "==> Health checks $(date -Iseconds)"
  check_url "backend" "http://127.0.0.1:${API_PORT:-8080}/api/v1/actuator/health" || true
  check_url "gateway" "http://127.0.0.1:${API_PORT:-8080}/api/v1/actuator/health" || true

  local fe_port
  fe_port="$(docker compose -f "$COMPOSE_FILE" port frontend 80 2>/dev/null | sed 's/.*://' || echo "${HTTP_PORT:-80}")"
  if curl -fsS --max-time 8 -o /dev/null -w '' "http://127.0.0.1:${fe_port}/"; then
    echo "OK  frontend :${fe_port}"
  else
    issues+=("frontend DOWN (:${fe_port})")
    echo "FAIL frontend"
  fi

  local disk_pct
  disk_pct="$(df -P / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')"
  echo "Disk / : ${disk_pct}%"
  if [[ "$disk_pct" -ge "$DISK_WARN" ]]; then
    issues+=("disk usage ${disk_pct}% (threshold ${DISK_WARN}%)")
  fi

  if [[ -d "$BACKUP_DIR" ]]; then
    local latest
    latest="$(find "$BACKUP_DIR" -maxdepth 1 -name 'pos_db_*.sql.gz' -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)"
    if [[ -z "$latest" ]]; then
      issues+=("no database backups in $BACKUP_DIR")
      echo "WARN no backups found"
    else
      local age_h
      age_h=$(( ( $(date +%s) - $(stat -c %Y "$latest" 2>/dev/null || stat -f %m "$latest") ) / 3600 ))
      echo "Last backup: $(basename "$latest") (${age_h}h ago)"
      if [[ "$age_h" -gt "$BACKUP_MAX_AGE_H" ]]; then
        issues+=("last backup ${age_h}h old (max ${BACKUP_MAX_AGE_H}h)")
      fi
    fi
  fi

  if [[ "${#issues[@]}" -gt 0 ]]; then
    local msg="⚠️ <b>Aurent POS alert</b>%0A%0A"
    for item in "${issues[@]}"; do
      msg+="- ${item}%0A"
    done
    send_telegram "$msg"
    printf '%s\n' "${issues[@]}" >&2
    exit 1
  fi

  echo "==> All checks passed"
}

cmd_install_cron() {
  local line="*/5 * * * * cd $ROOT && bash deploy/health-alert.sh >> $ROOT/logs/health-alert.log 2>&1"
  mkdir -p "$ROOT/logs"
  (crontab -l 2>/dev/null | grep -v 'deploy/health-alert.sh'; echo "$line") | crontab -
  echo "Cron installed: every 5 minutes"
  echo "$line"
}

case "${1:-check}" in
  check) cmd_check ;;
  install-cron) cmd_install_cron ;;
  *) echo "Usage: bash deploy/health-alert.sh [check|install-cron]"; exit 1 ;;
esac
