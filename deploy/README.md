# Деплой Aurent POS

```
push main → GitHub Actions → SSH → update.sh → deploy.sh → Docker
desktop-electron/** → Release Desktop → downloads/desktop/ на сервере
```

На сервере вручную: `bash deploy/update.sh`.

---

## Скрипты (4 фасада)

Универсальность сохранена через **подкоманды** — один вход на сценарий, без дублей файлов.

| Скрипт | Когда | Подкоманды |
|--------|--------|------------|
| `server-setup.sh` | **Один раз**: сервер / `.env` / CI SSH | `ubuntu` · `env` · `ci-ssh` |
| `update.sh` | Клон или каждое обновление | *(нет)* = `git pull` + `deploy.sh` · `bootstrap` = клон в `/opt/aurent-pos` |
| `deploy.sh` | Сборка и запуск `docker-compose.prod.yml` | *(нет)* = полный деплой · `check` · `verify-db` · `sync-db-password` · `recreate <service>` |
| `backup.sh` | Бэкапы Postgres | *(нет)* = создать · `restore <файл>` · `install-cron` |
| `publish-desktop.sh` | Артефакты Electron → `downloads/desktop/` + `manifest.json` | *(нет)* |

См. также: `CASHIER_GUIDE.md`, `CASHIER_SECURITY_CHECKLIST.md`, `RUNBOOK.md`.

Дополнительно: `nginx-host.conf.example` (опциональный SSL на хосте).

---

## Первый запуск

```bash
cd /opt/aurent-pos
sudo bash deploy/server-setup.sh ubuntu
bash deploy/update.sh bootstrap   # если ещё нет git-клона
bash deploy/server-setup.sh env && nano .env
bash deploy/deploy.sh check
bash deploy/deploy.sh
```

## Обновление

```bash
cd /opt/aurent-pos
bash deploy/update.sh
```

Или merge в `main` → CI сам деплоит.

## Staging (проверка до production)

Отдельный стек на **других портах** и **своих volumes** — не трогает prod.

```bash
cp .env.staging.example .env.staging
nano .env.staging   # пароли, JWT_SECRET (другие, чем на проде!)

STAGING=1 ENV_FILE=.env.staging bash deploy/deploy.sh check
STAGING=1 ENV_FILE=.env.staging bash deploy/deploy.sh
```

Проверка: `http://127.0.0.1:9080` (API gateway: `:9081`).  
Telegram-боты на staging **выключены** по умолчанию.

### GitHub Actions secrets

| Secret | Назначение |
|--------|------------|
| `DEPLOY_SSH_KEY` или `DEPLOY_SSH_KEY_B64` | SSH-ключ для деплоя |
| `DEPLOY_HOST` | IP или хост сервера |
| `DEPLOY_USER` | SSH-пользователь (по умолчанию `root`) |
| `DEPLOY_PUBLIC_URL` | Публичный URL (по умолчанию в CI: `https://aurent.uz`) |

## Проверка

```bash
bash deploy/deploy.sh check
curl -s http://localhost/api/v1/actuator/health
docker compose -f docker-compose.prod.yml ps
```

---

## Секреты `.env`

На сервере (не в git):

- `POSTGRES_PASSWORD`
- `JWT_SECRET` (≥ 32 символов)
- `AI_ASSISTANT_API_KEY` (если ассистент включён)
- `FINANCE_DB_PASSWORD`, `FINANCE_INTERNAL_API_KEY` (если finance включён)

### Два Telegram-бота

| Бот | Env | Для чего |
|-----|-----|----------|
| **Веб/десктоп поддержка** | `SUPPORT_TELEGRAM_BOT` + `TELEGRAM_WEB_SUPPORT_BOT_TOKEN` | Страница «Поддержка» в CRM и кассе |
| **Аптека** | `TELEGRAM_BOT_TOKEN` + `TELEGRAM_BOT_API_TOKEN` | Отдельный бот: только магазины PHARMACY |

---

## Бэкапы

```bash
bash deploy/backup.sh
sudo bash deploy/backup.sh install-cron
bash deploy/backup.sh restore backups/postgres/pos_db_YYYYMMDD_HHMMSS.sql.gz
```

---

## Касса, веб и десктоп

### Веб (браузер и Electron UI)

- Merge в `main` (пути `web-frontend/**`, backend и т.д.) → workflow **Deploy Web Stack**
- `index.html` без кэша — после деплоя достаточно **F5** или «Вид → Обновить» в кассе
- Electron по умолчанию грузит UI с сервера (`AURENT_WEB_URL`) — отдельный релиз оболочки не нужен для UI-правок
- Локальный UI в установщике (`uiMode: bundled`) — только тест; клиентам не включать, пока не пройдены фазы 2–3

### Десктоп (установщик + автообновление)

1. Поднимите версию в `desktop-electron/package.json` (`version`) **только когда готовы отдать сборку всем кассам** (автообновление)
2. Push в `main` с изменениями в `desktop-electron/**` → workflow **Release Desktop**
3. CI собирает `.exe` (Windows) и `.dmg` + `.zip` (macOS), публикует в `/downloads/desktop/`:
   - `latest.yml` / `latest-mac.yml` — для `electron-updater` (на Mac в фиде должен быть **zip**)
   - `manifest.json` — для страницы `/install`
4. Установленная касса проверяет обновления автоматически и через «Вид → Проверить обновления»
5. Новые пользователи: `https://домен/install`

Локально: `cd desktop-electron && npm run dist && bash ../deploy/publish-desktop.sh`

## SSL + dual domain (aurent.uz + r-aurent.uz)

DNS A/AAAA на сервер: `aurent.uz`, `www.aurent.uz`, `r-aurent.uz`, `www.r-aurent.uz`.

Docker слушает **только localhost**, host nginx — публичные 80/443:

```env
HTTP_PORT=127.0.0.1:8088
RESTAURANT_HTTP_PORT=127.0.0.1:5174
API_PORT=127.0.0.1:8080
VITE_RESTAURANT_APP_URL=https://r-aurent.uz
VITE_MAIN_APP_URL=https://aurent.uz
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://aurent.uz,https://www.aurent.uz,https://r-aurent.uz,https://www.r-aurent.uz,http://localhost:*,http://127.0.0.1:*,http://*:*,https://*:*
```

После смены `VITE_*` нужен rebuild `frontend` + `restaurant-frontend`.

```bash
apt install -y nginx certbot python3-certbot-nginx
cp deploy/nginx-host.conf.example /etc/nginx/sites-available/aurent-pos
ln -sf /etc/nginx/sites-available/aurent-pos /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
certbot --nginx -d aurent.uz -d www.aurent.uz -d r-aurent.uz -d www.r-aurent.uz
```

После certbot раскомментируйте `return 301 https://...` в блоках `:80` (см. шаблон).

Проверка без полного деплоя:

```bash
curl -sI -H 'Host: r-aurent.uz' http://127.0.0.1:5174/ | head -5
curl -sI -H 'Host: aurent.uz' http://127.0.0.1:8088/ | head -5
```

`MAIL_LOGIN_URL` при необходимости:

```env
MAIL_LOGIN_URL=https://aurent.uz/login?admin=1
```

HSTS отдаёт контейнерный nginx фронтов по `X-Forwarded-Proto: https`.

---

## Sentry (мониторинг ошибок)

По умолчанию **выключен**. Чтобы включить:

1. Создайте проект на [sentry.io](https://sentry.io) (Java + React)
2. В `.env` на сервере:

```env
SENTRY_DSN=https://...@....ingest.sentry.io/...
SENTRY_ENVIRONMENT=production
VITE_SENTRY_DSN=https://...@....ingest.sentry.io/...
VITE_SENTRY_ENVIRONMENT=production
```

3. Пересоберите и перезапустите (нужен rebuild frontend из‑за `VITE_*`):

```bash
cd /opt/aurent-pos
bash deploy/update.sh
```

4. Супер-админ → **Мониторинг** — статус Sentry «Подключён»

Без DSN система работает как раньше, без лишней нагрузки.

---

## Порты

| Порт | Назначение |
|------|------------|
| 80 / 443 | Host nginx → aurent.uz + r-aurent.uz |
| 127.0.0.1:8088 | Docker `frontend` (основной SPA) |
| 127.0.0.1:5174 | Docker `restaurant-frontend` |
| 127.0.0.1:8080 | API gateway (Electron / health) |
| 5432 | Postgres (только внутри Docker) |
