#!/usr/bin/env bash
# Настройка dual-domain: aurent.uz + r-aurent.uz (host nginx → Docker localhost).
# Идемпотентно. Не трогает секреты. Запуск: bash deploy/configure-restaurant-domain.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
NGINX_SRC="$ROOT/deploy/nginx-host.conf.example"
NGINX_DST="/etc/nginx/sites-available/aurent-pos"
NGINX_LINK="/etc/nginx/sites-enabled/aurent-pos"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет $ENV_FILE" >&2
  exit 1
fi

upsert_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    if sed --version >/dev/null 2>&1; then
      sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    fi
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
  echo "==> ${key}=${value}"
}

echo "==> Dual-domain env ($ENV_FILE)"
# Frontends only on localhost — HTTPS via host nginx :443. API public for Electron.
upsert_env HTTP_PORT '127.0.0.1:8088'
upsert_env RESTAURANT_HTTP_PORT '127.0.0.1:5174'
upsert_env API_PORT '8080'
upsert_env VITE_RESTAURANT_APP_URL 'https://r-aurent.uz'
upsert_env VITE_MAIN_APP_URL 'https://aurent.uz'
upsert_env APP_CORS_ALLOWED_ORIGIN_PATTERNS 'https://aurent.uz,https://www.aurent.uz,https://r-aurent.uz,https://www.r-aurent.uz,http://localhost:*,http://127.0.0.1:*,http://*:*,https://*:*'
upsert_env MAIL_LOGIN_URL 'https://aurent.uz/login?admin=1'

if [[ "${EUID}" -ne 0 ]]; then
  echo "==> SKIP nginx/certbot (нужен root). Env обновлён."
  exit 0
fi

# Free public :80 only if Docker still publishes it (blocks host nginx).
# Already on 127.0.0.1:8088/5174 — do not stop; partial deploys must not leave SPA down.
if command -v docker >/dev/null 2>&1 && [[ -f "$ROOT/docker-compose.prod.yml" ]]; then
  if ss -lntp 2>/dev/null | grep -E '0\.0\.0\.0:80\b' | grep -qi docker \
    || netstat -lntp 2>/dev/null | grep -E '0\.0\.0\.0:80\b' | grep -qi docker; then
    echo "==> Stop frontends briefly to free public :80"
    (cd "$ROOT" && docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" stop frontend restaurant-frontend 2>/dev/null) || true
  fi
fi

export DEBIAN_FRONTEND=noninteractive
if ! command -v nginx >/dev/null 2>&1; then
  echo "==> Install nginx + certbot"
  apt-get update -qq
  apt-get install -y -qq nginx certbot python3-certbot-nginx
fi

if [[ ! -f "$NGINX_SRC" ]]; then
  echo "Нет $NGINX_SRC" >&2
  exit 1
fi

echo "==> Install host nginx site"
if [[ -f "$NGINX_DST" ]]; then
  cp -a "$NGINX_DST" "${NGINX_DST}.bak.$(date +%Y%m%d%H%M%S)"
fi
cp "$NGINX_SRC" "$NGINX_DST"
ln -sf "$NGINX_DST" "$NGINX_LINK"
rm -f /etc/nginx/sites-enabled/default

if [[ ! -f /etc/letsencrypt/live/aurent.uz/fullchain.pem ]]; then
  echo "==> WARN: нет /etc/letsencrypt/live/aurent.uz — временно отключаю ssl_* до certbot"
  if sed --version >/dev/null 2>&1; then
    sed -i 's/^\([[:space:]]*listen .*ssl;\)/# \1/' "$NGINX_DST"
    sed -i 's/^\([[:space:]]*ssl_certificate\)/# \1/' "$NGINX_DST"
    sed -i 's/^\([[:space:]]*ssl_certificate_key\)/# \1/' "$NGINX_DST"
    sed -i 's/^\([[:space:]]*include \/etc\/letsencrypt\/options-ssl-nginx.conf;\)/# \1/' "$NGINX_DST"
    sed -i 's/^\([[:space:]]*ssl_dhparam\)/# \1/' "$NGINX_DST"
  else
    sed -i '' 's/^\([[:space:]]*listen .*ssl;\)/# \1/' "$NGINX_DST"
    sed -i '' 's/^\([[:space:]]*ssl_certificate\)/# \1/' "$NGINX_DST"
    sed -i '' 's/^\([[:space:]]*ssl_certificate_key\)/# \1/' "$NGINX_DST"
    sed -i '' 's/^\([[:space:]]*include \/etc\/letsencrypt\/options-ssl-nginx.conf;\)/# \1/' "$NGINX_DST"
    sed -i '' 's/^\([[:space:]]*ssl_dhparam\)/# \1/' "$NGINX_DST"
  fi
fi

if ! nginx -t; then
  echo "==> ERROR: nginx -t failed after writing $NGINX_DST" >&2
  latest_bak="$(ls -1t ${NGINX_DST}.bak.* 2>/dev/null | head -1 || true)"
  if [[ -n "$latest_bak" ]]; then
    echo "==> Restoring $latest_bak"
    cp -a "$latest_bak" "$NGINX_DST"
    nginx -t
  else
    exit 1
  fi
fi
systemctl enable nginx >/dev/null 2>&1 || true
systemctl reload nginx || systemctl restart nginx

if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q 'Status: active'; then
  ufw allow 80/tcp comment 'HTTP host nginx' >/dev/null 2>&1 || true
  ufw allow 443/tcp comment 'HTTPS host nginx' >/dev/null 2>&1 || true
fi

if command -v certbot >/dev/null 2>&1; then
  echo "==> Certbot (aurent.uz + r-aurent.uz)"
  if certbot --nginx \
    -d aurent.uz -d www.aurent.uz -d r-aurent.uz -d www.r-aurent.uz \
    --non-interactive --agree-tos --redirect \
    --email "${CERTBOT_EMAIL:-admin@aurent.uz}" \
    --keep-until-expiring 2>&1; then
    echo "==> TLS OK (оба домена)"
  else
    echo "==> WARN: полный certbot не прошёл — пробуем только aurent.uz"
    certbot --nginx -d aurent.uz -d www.aurent.uz \
      --non-interactive --agree-tos --redirect \
      --email "${CERTBOT_EMAIL:-admin@aurent.uz}" \
      --keep-until-expiring 2>&1 || true
  fi
else
  echo "==> SKIP certbot (не установлен)"
fi

# SPA proxies /api → gateway on :8088/:5174. Always bring them back after nginx work.
if command -v docker >/dev/null 2>&1 && [[ -f "$ROOT/docker-compose.prod.yml" ]]; then
  echo "==> Ensure frontends up (127.0.0.1:8088 / 5174)"
  (cd "$ROOT" && docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d --no-deps frontend restaurant-frontend) || true
fi

echo "==> configure-restaurant-domain: done"
