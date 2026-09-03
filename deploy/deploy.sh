#!/usr/bin/env bash
# Сборка и запуск production-стека + проверки/утилиты БД.
# Использование:
#   bash deploy/deploy.sh                     — полный деплой
#   bash deploy/deploy.sh check               — проверка готовности (.env, compose, секреты)
#   bash deploy/deploy.sh verify-db           — пароль .env совпадает с Postgres
#   bash deploy/deploy.sh sync-db-password    — починить пароль БД из .env
#   bash deploy/deploy.sh recreate <service>  — пересоздать один сервис (ghost-контейнеры)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
STAGING_OVERLAY="${STAGING_OVERLAY:-docker-compose.staging.yml}"
SUBCOMMAND="${1:-deploy}"

compose() {
  if [[ "${STAGING:-}" == "1" ]]; then
    docker compose -f "$COMPOSE_FILE" -f "$STAGING_OVERLAY" --env-file "$ENV_FILE" "$@"
  else
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
  fi
}

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

wait_container_healthy() {
  local name="$1"
  local label="${2:-$name}"
  local max="${3:-36}"
  local interval="${4:-5}"
  local status="unknown"

  echo "==> Ожидание health: ${label} (до $((max * interval))с)..."
  for _ in $(seq 1 "$max"); do
    status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$name" 2>/dev/null || echo "missing")"
    if [[ "$status" == "healthy" ]]; then
      echo "    ${label}: healthy"
      return 0
    fi
    sleep "$interval"
  done

  echo "ОШИБКА: ${label} не стал healthy (последний статус: ${status})" >&2
  return 1
}

compose_logs_tail() {
  local service="$1"
  local lines="${2:-120}"
  compose logs --tail="$lines" "$service" 2>/dev/null || true
}

declare -A CONTAINER_NAMES=(
  [postgres]=aurent-pos-db
  [finance-db]=aurent-finance-db
  [identity-db]=aurent-identity-db
  [platform-db]=aurent-platform-db
  [reporting-db]=aurent-reporting-db
  [crm-db]=aurent-crm-db
  [redpanda]=aurent-redpanda
  [finance-service]=aurent-finance-service
  [identity-service]=aurent-identity-service
  [platform-service]=aurent-platform-service
  [reporting-service]=aurent-reporting-service
  [crm-service]=aurent-crm-service
  [ai-service]=aurent-ai-service
  [backend]=aurent-pos-backend
  [api-gateway]=aurent-api-gateway
  [frontend]=aurent-pos-frontend
)

recreate_service() {
  local service="$1"
  local cname="${CONTAINER_NAMES[$service]:-}"

  compose stop "$service" 2>/dev/null || true
  compose rm -f "$service" 2>/dev/null || true

  # Точное имя: compose иногда теряет ghost-контейнер после сбоя/ручного up.
  if [[ -n "$cname" ]]; then
    docker rm -f "$cname" 2>/dev/null || true
  fi

  compose up -d --no-deps --force-recreate "$service"
}

verify_db() {
  local pg_user="${POSTGRES_USER:-pos_user}"
  local pg_db="${POSTGRES_DB:-pos_db}"

  echo "==> Проверка входа в PostgreSQL (пользователь $pg_user)..."
  if compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
    psql -U "$pg_user" -d "$pg_db" -c 'SELECT 1 AS ok;' >/dev/null 2>&1; then
    echo "OK: пароль из .env подходит к БД"
    return 0
  fi

  echo "ОШИБКА: пароль из .env НЕ подходит к существующей БД."
  echo "Исправление: bash deploy/deploy.sh sync-db-password"
  return 1
}

sync_db_password() {
  local pg_user="${POSTGRES_USER:-pos_user}"
  local pg_db="${POSTGRES_DB:-pos_db}"

  echo "==> Обновление пароля PostgreSQL для пользователя $pg_user"
  compose exec -T postgres \
    psql -U "$pg_user" -d postgres -v ON_ERROR_STOP=1 \
    -c "ALTER USER \"${pg_user}\" WITH PASSWORD '${POSTGRES_PASSWORD}';"

  echo "==> Проверка входа с паролем из .env..."
  compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
    psql -U "$pg_user" -d "$pg_db" -c 'SELECT 1 AS ok;'

  echo "OK: пароль синхронизирован"
}

# --- Предпрод проверка (секреты + compose), без тяжёлой локальной сборки ---
cmd_check() {
  local err=0
  local has_docker=0
  command -v docker >/dev/null 2>&1 && has_docker=1

  warn() { echo "  [!] $*"; err=1; }
  ok() { echo "  [ok] $*"; }
  skip() { echo "  [—] $*"; }

  echo "==> Aurent POS — проверка перед продом"
  echo ""
  echo "1. Файлы и секреты"
  if [[ ! -f "$ENV_FILE" ]]; then
    warn "Нет $ENV_FILE — создайте: bash deploy/server-setup.sh env"
  else
    ok "$ENV_FILE найден"
    load_dotenv "$ENV_FILE"
    if [[ "${JWT_SECRET:-}" == *"CHANGE_ME"* ]] || [[ ${#JWT_SECRET} -lt 32 ]]; then
      warn "JWT_SECRET: минимум 32 символа, не CHANGE_ME"
    else
      ok "JWT_SECRET задан"
    fi
    if [[ "${POSTGRES_PASSWORD:-}" == *"CHANGE_ME"* ]] || [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
      warn "POSTGRES_PASSWORD не задан"
    else
      ok "POSTGRES_PASSWORD задан"
    fi
    local key
    for key in IDENTITY_DB_PASSWORD IDENTITY_INTERNAL_API_KEY \
               PLATFORM_DB_PASSWORD PLATFORM_INTERNAL_API_KEY \
               REPORTING_DB_PASSWORD REPORTING_INTERNAL_API_KEY \
               CRM_DB_PASSWORD CRM_INTERNAL_API_KEY \
               RESTAURANT_DB_PASSWORD POS_INTERNAL_API_KEY; do
      if [[ "${!key:-}" == *"CHANGE_ME"* ]] || [[ -z "${!key:-}" ]]; then
        warn "${key} не задан"
      else
        ok "${key} задан"
      fi
    done
    if [[ "${FINANCE_SERVICE_ENABLED:-true}" == "true" ]]; then
      for key in FINANCE_DB_PASSWORD FINANCE_INTERNAL_API_KEY; do
        if [[ "${!key:-}" == *"CHANGE_ME"* ]] || [[ -z "${!key:-}" ]]; then
          warn "${key} не задан"
        else
          ok "${key} задан"
        fi
      done
    else
      skip "FINANCE_SERVICE_ENABLED=false"
    fi
  fi

  echo ""
  echo "2. Docker Compose (prod)"
  if [[ "$has_docker" -eq 1 ]]; then
    if [[ -f "$ENV_FILE" ]] && docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" config -q 2>/dev/null; then
      ok "$COMPOSE_FILE валиден"
    elif [[ -f .env.example ]]; then
      local temp_env jwt_tmp pg_tmp
      temp_env="$(mktemp)"
      jwt_tmp="$(openssl rand -base64 32 | tr -d '\n')"
      pg_tmp="$(openssl rand -base64 24 | tr -d '\n')"
      sed "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${pg_tmp}|; s|^JWT_SECRET=.*|JWT_SECRET=${jwt_tmp}|" .env.example >"$temp_env"
      if docker compose -f "$COMPOSE_FILE" --env-file "$temp_env" config -q 2>/dev/null; then
        ok "$COMPOSE_FILE валиден (по .env.example)"
      else
        warn "$COMPOSE_FILE — ошибка конфигурации"
      fi
      rm -f "$temp_env"
    else
      warn "Нужен .env или .env.example для проверки compose"
    fi
  else
    warn "docker не найден"
  fi

  echo ""
  if [[ "$err" -eq 0 ]]; then
    echo "Готово к деплою: bash deploy/deploy.sh"
    exit 0
  fi
  echo "Исправьте замечания выше перед выкладкой на прод."
  exit 1
}

if [[ "$SUBCOMMAND" == "check" ]]; then
  cmd_check
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет файла $ENV_FILE — создайте: bash deploy/server-setup.sh env"
  exit 1
fi

load_dotenv "$ENV_FILE"

case "$SUBCOMMAND" in
  verify-db)
    verify_db
    exit $?
    ;;
  sync-db-password)
    sync_db_password
    exit 0
    ;;
  recreate)
    shift || true
    if [[ -z "${1:-}" ]]; then
      echo "Использование: bash deploy/deploy.sh recreate <service>" >&2
      exit 1
    fi
    recreate_service "$1"
    exit 0
    ;;
  deploy)
    ;;
  *)
    echo "Использование: bash deploy/deploy.sh [deploy|check|verify-db|sync-db-password|recreate <service>]" >&2
    exit 1
    ;;
esac

require_env() {
  local key="$1"
  local val="${!key:-}"
  if [[ "$val" == *"CHANGE_ME"* ]] || [[ -z "$val" ]]; then
    echo "Ошибка: задайте ${key} в .env." >&2
    exit 1
  fi
}

ensure_secret() {
  local key="$1"
  local val="${!key:-}"
  if [[ -n "$val" && "$val" != *"CHANGE_ME"* ]]; then
    return 0
  fi
  local generated
  generated="$(openssl rand -base64 24 | tr -d '\n')"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    if sed --version >/dev/null 2>&1; then
      sed -i "s|^${key}=.*|${key}=${generated}|" "$ENV_FILE"
    else
      sed -i '' "s|^${key}=.*|${key}=${generated}|" "$ENV_FILE"
    fi
  else
    printf '\n%s=%s\n' "$key" "$generated" >> "$ENV_FILE"
  fi
  export "${key}=${generated}"
  echo "==> Сгенерирован ${key} в ${ENV_FILE}"
}

ensure_secret CRM_DB_PASSWORD
ensure_secret CRM_INTERNAL_API_KEY
ensure_secret RESTAURANT_DB_PASSWORD
ensure_secret POS_INTERNAL_API_KEY
if ! grep -q '^CRM_DB_NAME=' "$ENV_FILE" 2>/dev/null; then
  printf '\nCRM_DB_NAME=crm_db\nCRM_DB_USER=crm_user\n' >> "$ENV_FILE"
  echo "==> Добавлены CRM_DB_NAME / CRM_DB_USER в ${ENV_FILE}"
fi
if ! grep -q '^RESTAURANT_DB_NAME=' "$ENV_FILE" 2>/dev/null; then
  printf '\nRESTAURANT_DB_NAME=restaurant_db\nRESTAURANT_DB_USER=restaurant_user\n' >> "$ENV_FILE"
  echo "==> Добавлены RESTAURANT_DB_NAME / RESTAURANT_DB_USER в ${ENV_FILE}"
fi
load_dotenv "$ENV_FILE"

require_env JWT_SECRET
if [[ ${#JWT_SECRET} -lt 32 ]]; then
  echo "Ошибка: JWT_SECRET минимум 32 символа." >&2
  exit 1
fi
require_env POSTGRES_PASSWORD
require_env IDENTITY_DB_PASSWORD
require_env IDENTITY_INTERNAL_API_KEY
require_env PLATFORM_DB_PASSWORD
require_env PLATFORM_INTERNAL_API_KEY
require_env REPORTING_DB_PASSWORD
require_env REPORTING_INTERNAL_API_KEY
require_env CRM_DB_PASSWORD
require_env CRM_INTERNAL_API_KEY
require_env RESTAURANT_DB_PASSWORD
require_env POS_INTERNAL_API_KEY

if [[ "${FINANCE_SERVICE_ENABLED:-true}" == "true" ]]; then
  require_env FINANCE_DB_PASSWORD
  require_env FINANCE_INTERNAL_API_KEY
fi

echo "==> Сборка образов ($COMPOSE_FILE)..."
compose build --pull

echo "==> Инфраструктура: PostgreSQL (все БД) + Redpanda..."
compose up -d postgres finance-db identity-db platform-db reporting-db crm-db restaurant-db redpanda

wait_container_healthy aurent-pos-db postgres
wait_container_healthy aurent-identity-db identity-db
wait_container_healthy aurent-platform-db platform-db
wait_container_healthy aurent-reporting-db reporting-db
wait_container_healthy aurent-crm-db crm-db
wait_container_healthy aurent-restaurant-db restaurant-db
wait_container_healthy aurent-redpanda redpanda

if [[ "${FINANCE_SERVICE_ENABLED:-true}" == "true" ]]; then
  wait_container_healthy aurent-finance-db finance-db

  echo "==> finance-service..."
  if ! recreate_service finance-service; then
    compose_logs_tail finance-service 150
    exit 1
  fi
  wait_container_healthy aurent-finance-service finance-service || {
    compose_logs_tail finance-service 150
    exit 1
  }
else
  echo "==> FINANCE_SERVICE_ENABLED=false — finance-service пропущен."
fi

echo "==> Миграции БД: Liquibase при старте backend (db/changelog/)"

echo "==> Проверка пароля pos_db..."
if ! verify_db; then
  exit 1
fi

echo "==> web-backend (pos core)..."
if ! recreate_service backend; then
  compose_logs_tail backend 150
  exit 1
fi
wait_container_healthy aurent-pos-backend backend || {
  compose_logs_tail backend 150
  exit 1
}

echo "==> identity-service, platform-service, reporting-service, crm-service, restaurant-service, ai-service..."
for svc in identity-service platform-service reporting-service crm-service restaurant-service ai-service; do
  if ! recreate_service "$svc"; then
    compose_logs_tail "$svc" 150
    exit 1
  fi
done

wait_container_healthy aurent-identity-service identity-service || {
  compose_logs_tail identity-service 150
  exit 1
}
wait_container_healthy aurent-platform-service platform-service || {
  compose_logs_tail platform-service 150
  exit 1
}
wait_container_healthy aurent-reporting-service reporting-service || {
  compose_logs_tail reporting-service 150
  exit 1
}
wait_container_healthy aurent-crm-service crm-service || {
  compose_logs_tail crm-service 150
  exit 1
}
wait_container_healthy aurent-restaurant-service restaurant-service || {
  compose_logs_tail restaurant-service 150
  exit 1
}
wait_container_healthy aurent-ai-service ai-service || {
  compose_logs_tail ai-service 150
  exit 1
}

echo "==> api-gateway..."
if ! recreate_service api-gateway; then
  compose_logs_tail api-gateway 120
  exit 1
fi
wait_container_healthy aurent-api-gateway api-gateway || {
  compose_logs_tail api-gateway 120
  exit 1
}

echo "==> frontend..."
if ! recreate_service frontend; then
  compose_logs_tail frontend 80
  exit 1
fi

if [[ -n "${TELEGRAM_WEB_SUPPORT_BOT_TOKEN:-}" ]]; then
  echo "==> Telegram-бот поддержки веба (CRM/POS)..."
  compose up -d --build telegram-web-support-bot
else
  echo "==> TELEGRAM_WEB_SUPPORT_BOT_TOKEN не задан — веб-бот поддержки пропущен."
fi

if [[ -n "${TELEGRAM_BOT_RUNTIME_TOKEN:-}" || -n "${TELEGRAM_BOT_TOKEN:-}" || -n "${TELEGRAM_BOTS:-}" ]]; then
  echo "==> Telegram-бот(ы) аптеки (по компаниям)..."
  compose up -d --build telegram-support-bot
else
  echo "==> Аптечные боты пропущены (нет TELEGRAM_BOT_RUNTIME_TOKEN / TELEGRAM_BOT_TOKEN / TELEGRAM_BOTS)."
fi

echo ""
echo "==> Статус контейнеров:"
compose ps

SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo ""
echo "Проверка:"
echo "  Web:       http://${SERVER_IP:-localhost}:${HTTP_PORT:-80}/"
echo "  API (gw):  http://${SERVER_IP:-localhost}:${API_PORT:-8080}/api/v1/actuator/health"
echo "  Identity:  http://127.0.0.1:8081/api/v1/actuator/health (localhost)"
echo "  Finance:   http://127.0.0.1:8082/api/v1/swagger-ui.html (localhost)"
echo "  CRM:       http://127.0.0.1:8083/api/v1/actuator/health (localhost)"
echo "  Platform:  http://127.0.0.1:8084/api/v1/actuator/health (localhost)"
echo "  Reporting: http://127.0.0.1:8085/api/v1/actuator/health (localhost)"
echo "  AI:        http://127.0.0.1:8086/api/v1/actuator/health (localhost)"
echo "  Restaurant:http://127.0.0.1:8087/api/v1/actuator/health (localhost)"
echo "  Логи:      docker compose -f $COMPOSE_FILE logs -f api-gateway backend crm-service restaurant-service ai-service"

echo ""
echo "==> Smoke check..."
if bash deploy/smoke-check.sh; then
  echo "==> Smoke check: OK"
else
  echo "==> WARN: smoke check failed — см. deploy/smoke-check.sh и deploy/RUNBOOK.md"
fi

if [[ "${OPS_INSTALL_HEALTH_CRON:-}" == "true" ]]; then
  echo "==> Ops alerts cron (OPS_INSTALL_HEALTH_CRON=true)..."
  bash deploy/health-alert.sh install-cron
fi

echo "==> Health alert check..."
if bash deploy/health-alert.sh check; then
  echo "==> Health alert: OK"
else
  echo "==> WARN: health alert issues — deploy/RUNBOOK.md §9"
fi

if [[ -n "${SENTRY_DSN:-}" && -n "${VITE_SENTRY_DSN:-}" ]]; then
  echo "==> Sentry: backend + frontend DSN заданы"
elif [[ -n "${SENTRY_DSN:-}" ]]; then
  echo "==> WARN: Sentry backend задан, но нет VITE_SENTRY_DSN — frontend не отправит ошибки"
else
  echo "==> Sentry: не настроен (опционально: SENTRY_DSN + VITE_SENTRY_DSN в .env)"
fi
