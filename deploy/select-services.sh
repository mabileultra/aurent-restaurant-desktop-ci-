#!/usr/bin/env bash
# Какие compose-сервисы пересобрать по списку изменившихся путей.
# stdin: пути, по одному на строку.
# stdout: имена сервисов, либо одна строка FULL.
set -euo pipefail

FULL=0
JAVA_EXPAND=0
SEEN=""

JAVA_SERVICES="
finance-service
identity-service
platform-service
reporting-service
crm-service
restaurant-service
pharmacy-service
ai-service
backend
api-gateway
"

mark() {
  case "$SEEN" in
    *"|$1|"*) ;;
    *) SEEN="${SEEN}|$1|" ;;
  esac
}

has() {
  case "$SEEN" in
    *"|$1|"*) return 0 ;;
    *) return 1 ;;
  esac
}

expand_java() {
  local svc
  while IFS= read -r svc; do
    [[ -z "$svc" ]] && continue
    mark "$svc"
  done <<< "$JAVA_SERVICES"
}

classify() {
  local path="$1"
  [[ -z "$path" ]] && return 0

  case "$path" in
    docker-compose*.yml|.dockerignore)
      FULL=1
      return 0
      ;;
    pom.xml|shared-kernel|shared-kernel/*)
      JAVA_EXPAND=1
      return 0
      ;;
    web-frontend|web-frontend/*)
      mark frontend
      ;;
    restaurant-frontend|restaurant-frontend/*)
      mark restaurant-frontend
      ;;
    web-backend|web-backend/*)
      mark backend
      ;;
    finance-service|finance-service/*)
      mark finance-service
      ;;
    identity-service|identity-service/*)
      mark identity-service
      ;;
    platform-service|platform-service/*)
      mark platform-service
      ;;
    reporting-service|reporting-service/*)
      mark reporting-service
      ;;
    crm-service|crm-service/*)
      mark crm-service
      ;;
    restaurant-service|restaurant-service/*)
      mark restaurant-service
      ;;
    pharmacy-service|pharmacy-service/*)
      mark pharmacy-service
      ;;
    ai-service|ai-service/*)
      mark ai-service
      ;;
    api-gateway|api-gateway/*)
      mark api-gateway
      ;;
    telegram-support-bot|telegram-support-bot/*)
      mark telegram-support-bot
      ;;
    telegram-web-support-bot|telegram-web-support-bot/*)
      mark telegram-web-support-bot
      ;;
    deploy/*|scripts/*|.github/*|docs/*|downloads/*|desktop-electron|desktop-electron/*|*.md|.env.example|.gitignore|.gitattributes|LICENSE)
      ;;
    *)
      FULL=1
      ;;
  esac
}

while IFS= read -r path || [[ -n "$path" ]]; do
  path="${path%$'\r'}"
  classify "$path"
done

if [[ "$FULL" -eq 1 ]]; then
  echo FULL
  exit 0
fi

if [[ "$JAVA_EXPAND" -eq 1 ]]; then
  expand_java
fi

order="
finance-service
identity-service
platform-service
reporting-service
crm-service
restaurant-service
pharmacy-service
ai-service
backend
api-gateway
frontend
restaurant-frontend
telegram-web-support-bot
telegram-support-bot
"

while IFS= read -r svc; do
  [[ -z "$svc" ]] && continue
  if has "$svc"; then
    echo "$svc"
  fi
done <<< "$order"
