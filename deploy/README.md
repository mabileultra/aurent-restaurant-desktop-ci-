# Деплой Aurent POS

```
push main → GitHub Actions → SSH → update.sh → deploy.sh → Docker
```

На сервере вручную: `bash deploy/update.sh`.

---

## Скрипты

5 скриптов, у каждого есть подкоманды (без аргумента — поведение по умолчанию, см. ниже).

| Скрипт | Когда | Подкоманды |
|--------|--------|--------|
| `server-setup.sh` | **Один раз**: подготовка сервера/CI | `ubuntu` (Docker, UFW — root), `env` (создать `.env`), `ci-ssh` (SSH-ключ для GitHub Actions) |
| `update.sh` | **Один раз** / **каждое обновление** | *(нет)* = `git pull` + `deploy.sh`; `bootstrap` = клон репозитория в `/opt/aurent-pos` |
| `prod-check.sh` | Перед первым деплоем: JWT, пароли, Docker | — |
| `deploy.sh` | Сборка и запуск `docker-compose.prod.yml` | *(нет)* = полный деплой; `verify-db` = пароль `.env` совпадает с Postgres; `sync-db-password` = починить пароль БД из `.env` |
| `backup.sh` | Бэкапы Postgres | *(нет)* = создать бэкап; `restore <файл>` = восстановить; `install-cron` = ежедневный бэкап в 03:00 |

---

## Первый запуск

```bash
cd /opt/aurent-pos
sudo bash deploy/server-setup.sh ubuntu
bash deploy/server-setup.sh env && nano .env
bash deploy/prod-check.sh
bash deploy/deploy.sh
```

## Обновление

```bash
cd /opt/aurent-pos
bash deploy/update.sh
```

Или merge в `main` → CI сам деплоит (secrets: `DEPLOY_SSH_KEY_B64`, `DEPLOY_HOST`, `DEPLOY_USER`).

## Проверка

```bash
curl -s http://localhost/api/v1/actuator/health
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## Секреты `.env`

На сервере (не в git):

- `POSTGRES_PASSWORD`
- `JWT_SECRET` (≥ 32 символов)
# --- ИИ-ассистент (DeepSeek) — сервис ai-service:8086 ---
- `AI_ASSISTANT_API_KEY` (если ассистент включён)
- `FINANCE_DB_PASSWORD`, `FINANCE_INTERNAL_API_KEY` (если finance включён)

### Два Telegram-бота

| Бот | Env | Для чего |
|-----|-----|----------|
| **Веб-поддержка** | `TELEGRAM_WEB_SUPPORT_BOT_TOKEN` + `VITE_SUPPORT_TELEGRAM_BOT` | Страница «Поддержка» в CRM/POS |
| **Аптека (по компаниям)** | `TELEGRAM_BOT_RUNTIME_TOKEN` + настройки в CRM | Каждая аптечная компания — свой бот и свои магазины |

Быстрый фикс legacy (один бот): задать `TELEGRAM_BOT_COMPANY_ID=<id компании>` — иначе API больше не отдаёт все магазины всех компаний.

`VITE_SUPPORT_TELEGRAM_BOT` = **username веб-бота**, не аптечного.

---

## Бэкапы

```bash
bash deploy/backup.sh
sudo bash deploy/backup.sh install-cron
bash deploy/backup.sh restore backups/postgres/pos_db_YYYYMMDD_HHMMSS.sql.gz
```

---

## Касса и `/install`

- UI кассы: `update.sh` → «Вид → Обновить» в приложении
- Electron (`.exe`/`.dmg`) — репозиторий `aurent-cashier-desktop`, CI заливает в `downloads/desktop/`
- Страница: `https://домен/install`

## SSL

Опционально: nginx на хосте Ubuntu (SSL + прокси на Docker frontend `:80`).

```bash
apt install nginx certbot python3-certbot-nginx
```

Файл `/etc/nginx/sites-available/aurent-pos`, ссылка в `sites-enabled/`:

```nginx
server {
    listen 80;
    server_name pos.example.uz;

    client_max_body_size 80m;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

После `certbot --nginx -d pos.example.uz` certbot сам допишет блок `listen 443 ssl`.

## Порты

| Порт | Назначение |
|------|------------|
| 80 | Веб + nginx `/api` |
| 8080 | API напрямую (касса, health) |
| 5432 | Postgres (только внутри Docker) |
