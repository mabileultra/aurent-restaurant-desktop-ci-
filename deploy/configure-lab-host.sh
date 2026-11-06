#!/usr/bin/env bash
# Lab Contabo host: IP entry + localhost Docker + self-signed TLS. Never touch prod domains.
# Run: DEPLOY_TARGET=lab bash deploy/configure-lab-host.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
NGINX_SRC="$ROOT/deploy/nginx-host.lab.conf.example"
NGINX_DST="/etc/nginx/sites-available/aurent-pos"
NGINX_LINK="/etc/nginx/sites-enabled/aurent-pos"
SSL_DIR="/etc/nginx/ssl"
LAB_IP="${LAB_PUBLIC_IP:-}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет $ENV_FILE" >&2
  exit 1
fi

if [[ -z "$LAB_IP" ]]; then
  LAB_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi
if [[ -z "$LAB_IP" ]]; then
  echo "Задайте LAB_PUBLIC_IP=..." >&2
  exit 1
fi

upsert_env() {
  local key="$1" value="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
  echo "==> ${key}=${value}"
}

echo "==> Lab host env ($ENV_FILE) IP=$LAB_IP"
upsert_env HTTP_PORT '127.0.0.1:8088'
upsert_env RESTAURANT_HTTP_PORT '127.0.0.1:5174'
# Public :5175 — host nginx must not also bind 5175 (Address already in use).
upsert_env PHARMACY_HTTP_PORT '5175'
upsert_env API_PORT '8080'
upsert_env PUBLIC_URL "http://${LAB_IP}:8080"
upsert_env VITE_MAIN_APP_URL "http://${LAB_IP}"
upsert_env VITE_PHARMACY_APP_URL "http://${LAB_IP}:5175"
upsert_env VITE_RESTAURANT_APP_URL "http://${LAB_IP}:5174"
upsert_env ENABLE_TELEGRAM_BOTS 'false'
upsert_env TELEGRAM_BOTS '[]'
upsert_env VITE_SENTRY_ENVIRONMENT 'lab'
upsert_env APP_CORS_ALLOWED_ORIGIN_PATTERNS "http://${LAB_IP},http://${LAB_IP}:*,https://${LAB_IP},https://${LAB_IP}:*,http://localhost:*,http://127.0.0.1:*,http://*:*,https://*:*"
upsert_env MAIL_LOGIN_URL "http://${LAB_IP}/login?admin=1"

# Keep bots off across compose ups
mkdir -p "$ROOT"
cat > "$ROOT/docker-compose.override.yml" <<'EOF'
# Lab-only: telegram bots run on prod — do not start here.
services:
  telegram-support-bot:
    profiles: ["telegram-bots"]
  telegram-web-support-bot:
    profiles: ["telegram-bots"]
EOF

if [[ "${EUID}" -ne 0 ]]; then
  echo "==> SKIP nginx/ssl (нужен root). Env + override обновлены."
  exit 0
fi

if [[ ! -f "$NGINX_SRC" ]]; then
  echo "Нет $NGINX_SRC" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
if ! command -v nginx >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq nginx openssl
fi

mkdir -p "$SSL_DIR"
if [[ ! -f "$SSL_DIR/aurent-lab.crt" || ! -f "$SSL_DIR/aurent-lab.key" ]]; then
  echo "==> Self-signed TLS for lab IP"
  openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
    -keyout "$SSL_DIR/aurent-lab.key" \
    -out "$SSL_DIR/aurent-lab.crt" \
    -subj "/CN=${LAB_IP}" \
    -addext "subjectAltName=IP:${LAB_IP}"
  chmod 640 "$SSL_DIR/aurent-lab.key"
fi

if [[ -f "$NGINX_DST" ]]; then
  cp -a "$NGINX_DST" "${NGINX_DST}.bak.$(date +%Y%m%d%H%M%S)"
fi
sed "s/__LAB_IP__/${LAB_IP}/g" "$NGINX_SRC" > "$NGINX_DST"
ln -sf "$NGINX_DST" "$NGINX_LINK"
rm -f /etc/nginx/sites-enabled/default

# Free host :5175 if Docker still publishes publicly (host nginx will own it)
if command -v docker >/dev/null 2>&1 && [[ -f "$ROOT/docker-compose.prod.yml" ]]; then
  echo "==> Recreate frontends on localhost binds"
  (cd "$ROOT" && docker compose -p aurent-pos-lab -f docker-compose.prod.yml -f docker-compose.override.yml \
    --env-file "$ENV_FILE" up -d --no-deps --force-recreate frontend pharmacy-frontend) || true
fi

nginx -t
systemctl reload nginx
echo "==> Lab host nginx OK — http://${LAB_IP}/  https://${LAB_IP}/ (self-signed)  pharmacy :5175"
touch "$ROOT/.lab-host-configured"
