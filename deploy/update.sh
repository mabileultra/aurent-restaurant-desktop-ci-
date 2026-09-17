#!/usr/bin/env bash
# Обновление кода с GitHub (+ пересборка Docker) и первичное клонирование репозитория.
# Использование:
#   bash deploy/update.sh            — git pull + deploy.sh (на сервере после merge в main)
#   bash deploy/update.sh bootstrap  — один раз: клонировать репозиторий в /opt/aurent-pos
set -euo pipefail

SUBCOMMAND="${1:-update}"

cmd_update() {
  local root branch remote commit
  root="$(cd "$(dirname "$0")/.." && pwd)"
  cd "$root"

  branch="${BRANCH:-main}"
  remote="${REMOTE:-origin}"

  if [[ ! -d .git ]]; then
    echo "Папка не является git-репозиторием."
    echo "Один раз: bash deploy/update.sh bootstrap"
    exit 1
  fi

  if [[ -f .env ]]; then
    echo "==> .env сохранён (не трогаем)"
  else
    echo "Нет .env — создайте: bash deploy/server-setup.sh env"
    exit 1
  fi

  echo "==> git fetch $remote"
  git fetch "$remote"

  echo "==> git checkout $branch"
  git checkout "$branch"

  echo "==> git pull --ff-only $remote $branch"
  if ! git pull --ff-only "$remote" "$branch"; then
    echo "==> Локальные правки мешают pull — сброс до $remote/$branch (.env не в git, сохранится)"
    git reset --hard "$remote/$branch"
    git clean -fd -e .deploy-sha
  fi

  commit="$(git rev-parse --short HEAD)"
  echo "==> Код обновлён до $commit"

  chmod +x deploy/*.sh 2>/dev/null || true

  if [[ -n "${DEPLOY_SERVICES:-}" ]]; then
    echo "==> Деплой только: ${DEPLOY_SERVICES}"
  else
    echo "==> Деплой по изменённым файлам (.deploy-sha). Полный стек: DEPLOY_FULL=1"
  fi
  # Явно прокидываем флаги — load_dotenv в deploy.sh не должен их затирать.
  DEPLOY_SERVICES="${DEPLOY_SERVICES:-}" \
  DEPLOY_FULL="${DEPLOY_FULL:-0}" \
  DEPLOY_FROM_SHA="${DEPLOY_FROM_SHA:-}" \
  DEPLOY_PULL="${DEPLOY_PULL:-0}" \
  bash deploy/deploy.sh
}

cmd_bootstrap() {
  local repo_url branch app_dir env_backup stamp backup_dir
  repo_url="${REPO_URL:-https://github.com/Timur1019/postsystem.git}"
  branch="${BRANCH:-main}"
  app_dir="${APP_DIR:-/opt/aurent-pos}"

  if [[ "${EUID}" -ne 0 ]] && [[ ! -w "$app_dir" ]] 2>/dev/null; then
    echo "Запустите от root или с правами на $app_dir:"
    echo "  sudo bash deploy/update.sh bootstrap"
    exit 1
  fi

  if [[ -d "$app_dir/.git" ]]; then
    echo "Git уже настроен в $app_dir"
    cd "$app_dir"
    git remote -v
    git branch -vv
    exit 0
  fi

  env_backup=""
  if [[ -f "$app_dir/.env" ]]; then
    env_backup="$(mktemp)"
    cp "$app_dir/.env" "$env_backup"
    echo "Сохранён .env → $env_backup"
  fi

  if [[ -d "$app_dir" ]] && [[ -n "$(ls -A "$app_dir" 2>/dev/null)" ]]; then
    stamp="$(date +%Y%m%d%H%M%S)"
    backup_dir="${app_dir}.rsync-backup-${stamp}"
    echo "Резервная копия текущей папки → $backup_dir"
    mv "$app_dir" "$backup_dir"
  fi

  mkdir -p "$(dirname "$app_dir")"
  git clone --branch "$branch" "$repo_url" "$app_dir"

  if [[ -n "$env_backup" ]] && [[ -f "$env_backup" ]]; then
    cp "$env_backup" "$app_dir/.env"
    rm -f "$env_backup"
    echo "Восстановлен .env"
  elif [[ ! -f "$app_dir/.env" ]]; then
    echo "Создайте секреты: cd $app_dir && bash deploy/server-setup.sh env"
  fi

  cd "$app_dir"
  chmod +x deploy/*.sh 2>/dev/null || true

  echo ""
  echo "Готово. Репозиторий: $repo_url ($branch)"
  echo "Дальше: cd $app_dir && bash deploy/deploy.sh check && bash deploy/deploy.sh"
  echo "Обновления: bash deploy/update.sh"
}

case "$SUBCOMMAND" in
  update)
    cmd_update
    ;;
  bootstrap)
    cmd_bootstrap
    ;;
  *)
    echo "Использование: bash deploy/update.sh [update|bootstrap]" >&2
    exit 1
    ;;
esac
