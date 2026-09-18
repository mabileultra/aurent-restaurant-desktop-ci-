#!/usr/bin/env bash
# Выкладка только сервисов из git-diff с прошлого успешного деплоя.
# Возврат: 0 — готово, 2 — вызывающему нужна полная сборка.
deploy_changed_stack() {
  local from=""
  local mapped=""
  local line=""
  local svc=""
  local cname=""
  local health=""
  local -a targets=()
  local -a build_targets=()

  if [[ -n "${DEPLOY_SERVICES:-}" ]]; then
    read -r -a targets <<< "${DEPLOY_SERVICES//,/ }"
  else
    if [[ -n "${DEPLOY_FROM_SHA:-}" ]]; then
      from="$DEPLOY_FROM_SHA"
    elif [[ -f "$ROOT/.deploy-sha" ]]; then
      from="$(tr -d '[:space:]' < "$ROOT/.deploy-sha")"
    fi
    if [[ -z "$from" ]]; then
      return 2
    fi
    if ! git rev-parse --verify "${from}^{commit}" >/dev/null 2>&1; then
      echo "==> Предыдущий коммит деплоя не найден в git — полная сборка"
      return 2
    fi
    if [[ "$from" == "$(git rev-parse HEAD)" ]]; then
      echo "==> Код не менялся — образы не пересобираю"
      bash "$ROOT/deploy/smoke-check.sh" || echo "==> WARN: smoke check failed"
      return 0
    fi
    mapped="$(git diff --name-only "$from" HEAD | bash "$ROOT/deploy/select-services.sh")"
    if [[ "$mapped" == "FULL" || "$mapped" == *$'\n'FULL || "$mapped" == FULL$'\n'* ]]; then
      return 2
    fi
    if [[ -z "$mapped" ]]; then
      echo "==> Изменения не в образах ($from..$(git rev-parse --short HEAD))"
      bash "$ROOT/deploy/smoke-check.sh" || echo "==> WARN: smoke check failed"
      return 0
    fi
    while IFS= read -r line; do
      [[ -n "$line" ]] && targets+=("$line")
    done <<< "$mapped"
  fi

  if [[ "${FINANCE_SERVICE_ENABLED:-true}" != "true" ]]; then
    local -a filtered=()
    for svc in "${targets[@]}"; do
      [[ "$svc" == "finance-service" ]] && continue
      filtered+=("$svc")
    done
    if [[ ${#filtered[@]} -eq 0 ]]; then
      targets=()
    else
      targets=("${filtered[@]}")
    fi
  fi

  if [[ ${#targets[@]} -eq 0 ]]; then
    echo "==> Нечего пересобирать"
    return 0
  fi

  if [[ -z "${DEPLOY_SERVICES:-}" ]]; then
    local missing=0
    for svc in backend api-gateway frontend identity-service; do
      cname="${CONTAINER_NAMES[$svc]:-}"
      if [[ -n "$cname" ]] && ! docker inspect "$cname" >/dev/null 2>&1; then
        missing=$((missing + 1))
      fi
    done
    if [[ "$missing" -gt 0 ]]; then
      echo "==> Нет базовых контейнеров — полная сборка"
      return 2
    fi
  fi

  echo "==> Пересборка только: ${targets[*]}"
  export DOCKER_BUILDKIT=1
  export COMPOSE_DOCKER_CLI_BUILD=1
  export COMPOSE_BAKE=0
  export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-2}"

  for svc in "${targets[@]}"; do
    case "$svc" in
      telegram-support-bot|telegram-web-support-bot) ;;
      *) build_targets+=("$svc") ;;
    esac
  done

  echo "==> Инфраструктура (без пересоздания БД)..."
  compose up -d postgres finance-db identity-db platform-db reporting-db crm-db restaurant-db pharmacy-db redpanda
  wait_container_healthy aurent-pos-db postgres
  if ! verify_db; then
    return 1
  fi

  if [[ ${#build_targets[@]} -gt 0 ]]; then
    if [[ "${DEPLOY_PULL:-0}" == "1" ]]; then
      compose build --pull "${build_targets[@]}"
    else
      compose build "${build_targets[@]}"
    fi
  fi

  for svc in "${targets[@]}"; do
    case "$svc" in
      telegram-support-bot)
        if [[ -n "${TELEGRAM_BOT_RUNTIME_TOKEN:-}" || -n "${TELEGRAM_BOT_TOKEN:-}" || -n "${TELEGRAM_BOTS:-}" ]]; then
          compose up -d --build --no-deps telegram-support-bot
        fi
        continue
        ;;
      telegram-web-support-bot)
        if [[ -n "${TELEGRAM_WEB_SUPPORT_BOT_TOKEN:-}" ]]; then
          compose up -d --build --no-deps telegram-web-support-bot
        fi
        continue
        ;;
    esac
    if ! recreate_service "$svc"; then
      compose_logs_tail "$svc" 150
      return 1
    fi
    cname="${CONTAINER_NAMES[$svc]:-}"
    if [[ -z "$cname" ]]; then
      continue
    fi
    health="$(docker inspect --format='{{if .State.Health}}yes{{else}}no{{end}}' "$cname" 2>/dev/null || echo no)"
    if [[ "$health" == "yes" ]]; then
      wait_container_healthy "$cname" "$svc" || {
        compose_logs_tail "$svc" 150
        return 1
      }
    fi
  done

  echo "==> Smoke check..."
  if bash "$ROOT/deploy/smoke-check.sh"; then
    echo "==> Smoke check: OK"
  else
    echo "==> WARN: smoke check failed — см. deploy/smoke-check.sh"
  fi
  return 0
}
