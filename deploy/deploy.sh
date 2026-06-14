#!/usr/bin/env bash
# Сборка и запуск production-стека на сервере.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE="${ENV_FILE:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет файла $ENV_FILE — скопируйте: cp .env.example .env && отредактируйте пароли."
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [[ "${JWT_SECRET:-}" == *"CHANGE_ME"* ]] || [[ ${#JWT_SECRET} -lt 32 ]]; then
  echo "Ошибка: задайте JWT_SECRET в .env (минимум 32 символа)."
  exit 1
fi

if [[ "${POSTGRES_PASSWORD:-}" == *"CHANGE_ME"* ]]; then
  echo "Ошибка: задайте POSTGRES_PASSWORD в .env."
  exit 1
fi

if [[ "${FINANCE_SERVICE_ENABLED:-true}" == "true" ]]; then
  if [[ "${FINANCE_DB_PASSWORD:-}" == *"CHANGE_ME"* ]]; then
    echo "Ошибка: задайте FINANCE_DB_PASSWORD в .env."
    exit 1
  fi
  if [[ "${FINANCE_INTERNAL_API_KEY:-}" == *"CHANGE_ME"* ]]; then
    echo "Ошибка: задайте FINANCE_INTERNAL_API_KEY в .env."
    exit 1
  fi
fi

echo "==> Сборка образов ($COMPOSE_FILE)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --pull

echo "==> Запуск PostgreSQL..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres

if [[ "${FINANCE_SERVICE_ENABLED:-true}" == "true" ]]; then
  echo "==> Запуск Finance PostgreSQL..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d finance-db

  echo "==> Запуск finance-service..."
  if ! docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps finance-service; then
    echo "==> Ошибка запуска finance-service. Последние логи:"
    docker compose -f "$COMPOSE_FILE" logs --tail=120 finance-service || true
    exit 1
  fi

  echo "==> Ожидание health finance-service (до ~3 мин)..."
  finance_ok=0
  for _ in $(seq 1 36); do
    health="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' aurent-finance-service 2>/dev/null || echo "missing")"
    if [[ "$health" == "healthy" ]]; then
      finance_ok=1
      break
    fi
    sleep 5
  done

  if [[ "$finance_ok" != "1" ]]; then
    echo "==> finance-service не поднялся. Логи:"
    docker compose -f "$COMPOSE_FILE" logs --tail=150 finance-service || true
    exit 1
  fi
else
  echo "==> FINANCE_SERVICE_ENABLED=false — finance-service пропущен."
fi

if [[ "${RUN_LEGACY_MIGRATE:-}" == "1" ]]; then
  echo "==> Legacy SQL-миграции (migrate-db.sh)..."
  bash deploy/migrate-db.sh
else
  echo "==> Миграции БД: Liquibase при старте backend (db/changelog/)"
  echo "    (fallback без рестарта: RUN_LEGACY_MIGRATE=1 bash deploy/deploy.sh)"
fi

echo "==> Проверка пароля БД..."
if ! bash deploy/verify-db.sh; then
  exit 1
fi

echo "==> Запуск backend..."
if ! docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps backend; then
  echo "==> Ошибка запуска backend. Последние логи:"
  docker compose -f "$COMPOSE_FILE" logs --tail=120 backend || true
  exit 1
fi

echo "==> Ожидание health backend (до ~3 мин)..."
backend_ok=0
for _ in $(seq 1 36); do
  if docker compose -f "$COMPOSE_FILE" exec -T backend \
    curl -fsS http://127.0.0.1:8080/api/v1/actuator/health 2>/dev/null | grep -q UP; then
    backend_ok=1
    break
  fi
  sleep 5
done

if [[ "$backend_ok" != "1" ]]; then
  echo "==> Backend не поднялся. Логи:"
  docker compose -f "$COMPOSE_FILE" logs --tail=150 backend || true
  exit 1
fi

echo "==> Запуск frontend..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d frontend

if [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "==> Запуск Telegram-бота поддержки..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build telegram-support-bot
else
  echo "==> TELEGRAM_BOT_TOKEN не задан — бот поддержки пропущен."
fi

echo ""
echo "==> Статус контейнеров:"
docker compose -f "$COMPOSE_FILE" ps

SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo ""
echo "Проверка:"
echo "  Web:    http://${SERVER_IP:-localhost}:${HTTP_PORT:-80}/"
echo "  API:    http://${SERVER_IP:-localhost}:${API_PORT:-8080}/api/v1/actuator/health"
echo "  Finance: http://${SERVER_IP:-localhost}:8082/api/v1/swagger-ui.html (localhost only)"
echo "  Логи:   docker compose -f $COMPOSE_FILE logs -f backend"
echo "  Finance: docker compose -f $COMPOSE_FILE logs -f finance-service"
if [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "  Бот:    docker compose -f $COMPOSE_FILE logs -f telegram-support-bot"
fi
