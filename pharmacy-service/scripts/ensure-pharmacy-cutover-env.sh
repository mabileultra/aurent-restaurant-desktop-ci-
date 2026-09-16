#!/usr/bin/env bash
# Ensure POS_CORE_DATASOURCE_* exist in ENV_FILE for one-shot pharmacy migrator.
# Does not print secret values.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
set -a
# Load only keys we need without echoing
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"
  [[ -z "${line//[[:space:]]/}" || "$line" =~ ^[[:space:]]*# ]] && continue
  if [[ "$line" =~ ^(POSTGRES_DB|POSTGRES_USER|POSTGRES_PASSWORD)=(.*)$ ]]; then
    printf -v "${BASH_REMATCH[1]}" '%s' "${BASH_REMATCH[2]}"
    export "${BASH_REMATCH[1]}"
  fi
done < "$ENV_FILE"
set +a

PG_DB="${POSTGRES_DB:-pos_db}"
PG_USER="${POSTGRES_USER:-pos_user}"
PG_PASS="${POSTGRES_PASSWORD:-}"

if [[ -z "$PG_PASS" ]]; then
  echo "POSTGRES_PASSWORD missing in $ENV_FILE"
  exit 1
fi

touch "$ENV_FILE"
if ! grep -q '^POS_CORE_DATASOURCE_URL=' "$ENV_FILE"; then
  printf '\nPOS_CORE_DATASOURCE_URL=jdbc:postgresql://postgres:5432/%s\n' "$PG_DB" >> "$ENV_FILE"
  echo "==> Added POS_CORE_DATASOURCE_URL"
fi
if ! grep -q '^POS_CORE_DATASOURCE_USERNAME=' "$ENV_FILE"; then
  printf 'POS_CORE_DATASOURCE_USERNAME=%s\n' "$PG_USER" >> "$ENV_FILE"
  echo "==> Added POS_CORE_DATASOURCE_USERNAME"
fi
if ! grep -q '^POS_CORE_DATASOURCE_PASSWORD=' "$ENV_FILE"; then
  printf 'POS_CORE_DATASOURCE_PASSWORD=%s\n' "$PG_PASS" >> "$ENV_FILE"
  echo "==> Added POS_CORE_DATASOURCE_PASSWORD"
fi

echo "Pharmacy cutover env ready in $ENV_FILE"
