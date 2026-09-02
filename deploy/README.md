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
- Electron грузит UI с сервера (`AURENT_WEB_URL`) — отдельный релиз оболочки не нужен для UI-правок

### Десктоп (установщик + автообновление)

1. Поднимите версию в `desktop-electron/package.json` (`version`)
2. Push в `main` с изменениями в `desktop-electron/**` → workflow **Release Desktop**
3. CI собирает `.exe` (Windows) и `.dmg` (macOS), публикует в `/downloads/desktop/`:
   - `latest.yml` / `latest-mac.yml` — для `electron-updater`
   - `manifest.json` — для страницы `/install`
4. Установленная касса проверяет обновления автоматически и через «Вид → Проверить обновления»
5. Новые пользователи: `https://домен/install`

Локально: `cd desktop-electron && npm run dist && bash ../deploy/publish-desktop.sh`

## SSL (HTTPS на хосте)

Docker отдаёт HTTP на `:80`. Для **https://ваш-домен** — nginx на Ubuntu + Let's Encrypt:

```bash
apt install -y nginx certbot python3-certbot-nginx
cp deploy/nginx-host.conf.example /etc/nginx/sites-available/aurent-pos
# замените pos.example.uz на ваш домен
nano /etc/nginx/sites-available/aurent-pos
ln -sf /etc/nginx/sites-available/aurent-pos /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
certbot --nginx -d your-domain.uz
```

После certbot раскомментируйте `return 301 https://...` в блоке `:80` (см. шаблон).

В `.env` обновите при необходимости:

```env
MAIL_LOGIN_URL=https://your-domain.uz/login?admin=1
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://your-domain.uz,http://localhost:*,http://127.0.0.1:*
```

Пересборка не обязательна для SSL — только nginx на хосте. Frontend внутри Docker подхватит `X-Forwarded-Proto: https` и отдаст HSTS.

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
| 80 | Веб + nginx `/api` |
| 8080 | API напрямую (касса, health) |
| 5432 | Postgres (только внутри Docker) |
