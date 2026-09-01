#!/usr/bin/env bash
# Откат на предыдущий коммит (или указанный) + пересборка Docker.
#
# Usage:
#   bash deploy/rollback.sh              # на 1 коммит назад
#   bash deploy/rollback.sh abc1234      # на конкретный коммит
#   ROLLBACK_REF=abc1234 bash deploy/rollback.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TARGET="${ROLLBACK_REF:-${1:-HEAD~1}}"
LOG_FILE="${ROOT}/logs/rollback.log"

if [[ ! -d .git ]]; then
  echo "Не git-репозиторий: $ROOT"
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Нет .env — откат отменён"
  exit 1
fi

CURRENT="$(git rev-parse HEAD)"
if ! git cat-file -e "${TARGET}^{commit}" 2>/dev/null; then
  echo "Коммит не найден: $TARGET"
  exit 1
fi

TARGET_FULL="$(git rev-parse "$TARGET")"
if [[ "$CURRENT" == "$TARGET_FULL" ]]; then
  echo "Уже на коммите $CURRENT"
  exit 0
fi

mkdir -p "$(dirname "$LOG_FILE")"
echo "$(date -Iseconds) rollback $CURRENT -> $TARGET_FULL" >>"$LOG_FILE"

echo "==> Откат: $(git rev-parse --short "$CURRENT") → $(git rev-parse --short "$TARGET_FULL")"
echo "    Текущий (для возврата): $CURRENT"
git checkout main 2>/dev/null || true
git reset --hard "$TARGET_FULL"

chmod +x deploy/*.sh 2>/dev/null || true
bash deploy/deploy.sh

echo ""
echo "==> Откат завершён."
echo "    Вернуть как было: git reset --hard $CURRENT && bash deploy/deploy.sh"
