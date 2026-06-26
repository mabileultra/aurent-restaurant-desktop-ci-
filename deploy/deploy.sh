#!/usr/bin/env bash
# Сборка и запуск production-стека (микросервисы + gateway + frontend).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE="${ENV_FILE:-.env}"

# shellcheck source=deploy/wait-healthy.sh
source "$ROOT/deploy/wait-healthy.sh"

require_env() {
  local key="$1"
  local val="${!key:-}"
  if [[ "$val" == *"CHANGE_ME"* ]] || [[ -z "$val" ]]; then
    echo "Ошибка: задайте ${key} в .env." >&2
    exit 1
  fi
}

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

recreate_service() {
  COMPOSE_FILE="$COMPOSE_FILE" ENV_FILE="$ENV_FILE" bash "$ROOT/deploy/docker-recreate-service.sh" "$1"
}

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет файла $ENV_FILE — скопируйте: cp .env.example .env && отредактируйте пароли."
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

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

if [[ "${FINANCE_SERVICE_ENABLED:-true}" == "true" ]]; then
  require_env FINANCE_DB_PASSWORD
  require_env FINANCE_INTERNAL_API_KEY
fi

chmod +x deploy/docker-recreate-service.sh deploy/wait-healthy.sh

echo "==> Сборка образов ($COMPOSE_FILE)..."
compose build --pull

echo "==> Инфраструктура: PostgreSQL (все БД) + Redpanda..."
compose up -d postgres finance-db identity-db platform-db reporting-db redpanda

wait_container_healthy aurent-pos-db postgres
wait_container_healthy aurent-identity-db identity-db
wait_container_healthy aurent-platform-db platform-db
wait_container_healthy aurent-reporting-db reporting-db
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

if [[ "${RUN_LEGACY_MIGRATE:-}" == "1" ]]; then
  echo "==> Legacy SQL-миграции (optional/migrate-db.sh)..."
  bash deploy/optional/migrate-db.sh
else
  echo "==> Миграции БД: Liquibase при старте backend (db/changelog/)"
fi

echo "==> Проверка пароля pos_db..."
if ! bash deploy/verify-db.sh; then
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

echo "==> identity-service, platform-service, reporting-service..."
for svc in identity-service platform-service reporting-service; do
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

if [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "==> Telegram-бот поддержки..."
  compose up -d --build telegram-support-bot
else
  echo "==> TELEGRAM_BOT_TOKEN не задан — бот поддержки пропущен."
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
echo "  Platform:  http://127.0.0.1:8084/api/v1/actuator/health (localhost)"
echo "  Reporting: http://127.0.0.1:8085/api/v1/actuator/health (localhost)"
echo "  Логи:      docker compose -f $COMPOSE_FILE logs -f api-gateway backend"
