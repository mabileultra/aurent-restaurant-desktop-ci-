#!/usr/bin/env bash
# Push main to both remotes so server pull + mabileultra Actions stay in sync.
# origin     = Timur1019/postsystem          (server git pull)
# mobile-ci  = mabileultra/...-ci-           (auto-deploy when Actions minutes exist)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

branch="${BRANCH:-main}"
origin_remote="${ORIGIN_REMOTE:-origin}"
ci_remote="${CI_REMOTE:-mobile-ci}"

echo "==> Push ${branch} → ${origin_remote} (server source)"
git push "$origin_remote" "$branch"

echo "==> Push ${branch} → ${ci_remote} (Actions auto-deploy)"
git push "$ci_remote" "$branch"

echo "==> Done. Watch: https://github.com/mabileultra/aurent-restaurant-desktop-ci-/actions"
