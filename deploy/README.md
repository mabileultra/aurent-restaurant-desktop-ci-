# Деплой Aurent POS

```
push main → GitHub Actions → SSH → update.sh → deploy.sh → Docker
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

Или merge в `main` → CI сам деплоит (secrets: `DEPLOY_SSH_KEY_B64`, `DEPLOY_HOST`, `DEPLOY_USER`).

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

## Касса и `/install`

- UI кассы: `update.sh` → в приложении «Вид → Обновить»
- Electron (`.exe`/`.dmg`) — репозиторий `aurent-cashier-desktop`, CI → `downloads/desktop/`
- Страница: `https://домен/install`

## SSL

Опционально: nginx на хосте Ubuntu (SSL + прокси на Docker frontend `:80`).

```bash
apt install nginx certbot python3-certbot-nginx
```

Шаблон: `deploy/nginx-host.conf.example`.

## Порты

| Порт | Назначение |
|------|------------|
| 80 | Веб + nginx `/api` |
| 8080 | API напрямую (касса, health) |
| 5432 | Postgres (только внутри Docker) |
