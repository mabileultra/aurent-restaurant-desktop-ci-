#!/usr/bin/env bash
# Ожидание docker healthcheck контейнера по имени.
# Использование: source deploy/wait-healthy.sh && wait_container_healthy aurent-pos-backend "backend"
set -euo pipefail

wait_container_healthy() {
  local name="$1"
  local label="${2:-$name}"
  local max="${3:-36}"
  local interval="${4:-5}"

  echo "==> Ожидание health: ${label} (до $((max * interval))с)..."
  for _ in $(seq 1 "$max"); do
    local status
    status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$name" 2>/dev/null || echo "missing")"
    if [[ "$status" == "healthy" ]]; then
      echo "    ${label}: healthy"
      return 0
    fi
    sleep "$interval"
  done

  echo "ОШИБКА: ${label} не стал healthy (последний статус: ${status:-unknown})" >&2
  return 1
}

compose_logs_tail() {
  local service="$1"
  local lines="${2:-120}"
  docker compose -f "${COMPOSE_FILE:-docker-compose.prod.yml}" logs --tail="$lines" "$service" 2>/dev/null || true
}
