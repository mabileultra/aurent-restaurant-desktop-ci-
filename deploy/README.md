# Деплой Aurent POS

```
push main → GitHub Actions → SSH → git-update.sh → deploy.sh → Docker
```

На сервере вручную: `bash deploy/git-update.sh`.

---

## Скрипты

| Скрипт | Когда |
|--------|--------|
| `ubuntu-prepare.sh` | **Один раз** на чистом Ubuntu: Docker, UFW |
| `git-bootstrap.sh` | **Один раз**: клон/git в `/opt/aurent-pos` |
| `setup-env.sh` | **Один раз**: создать `.env` из `.env.example` |
| `prod-check.sh` | Перед первым деплоем: JWT, пароли, Docker |
| `deploy.sh` | Сборка и запуск `docker-compose.prod.yml` |
| `git-update.sh` | **Каждое обновление**: `git pull` + `deploy.sh` |
| `backup-db.sh` | Бэкап Postgres (CI делает перед деплоем) |
| `restore-db.sh` | Восстановление из дампа |
| `install-backup-cron.sh` | Cron бэкапа в 03:00 |
| `ci-ssh-setup.sh` | Только GitHub Actions (SSH-ключ) |

Вспомогательные (вызываются из `deploy.sh`):

- `docker-recreate-service.sh` — пересоздать один сервис
- `wait-healthy.sh` — ждать healthy контейнера
- `load-dotenv.sh` — безопасная загрузка `.env`
- `verify-db.sh` — пароль `.env` совпадает с Postgres
- `sync-db-password.sh` — починить пароль БД из `.env`

---

## Первый запуск

```bash
cd /opt/aurent-pos
sudo bash deploy/ubuntu-prepare.sh
bash deploy/setup-env.sh && nano .env
bash deploy/prod-check.sh
bash deploy/deploy.sh
```

## Обновление

```bash
cd /opt/aurent-pos
bash deploy/git-update.sh
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
- `AI_ASSISTANT_API_KEY` (если ассистент включён)
- `FINANCE_DB_PASSWORD`, `FINANCE_INTERNAL_API_KEY` (если finance включён)

### Два Telegram-бота

| Бот | Env | Для чего |
|-----|-----|----------|
| **Веб-поддержка** | `TELEGRAM_WEB_SUPPORT_BOT_TOKEN` + `VITE_SUPPORT_TELEGRAM_BOT` | Страница «Поддержка» в CRM/POS |
| **Аптека** | `TELEGRAM_BOT_TOKEN` | Поиск лекарств + поддержка аптеки |

`VITE_SUPPORT_TELEGRAM_BOT` = **username веб-бота**, не аптечного.

---

## Бэкапы

```bash
bash deploy/backup-db.sh
bash deploy/install-backup-cron.sh
bash deploy/restore-db.sh backups/postgres/pos_db_YYYYMMDD_HHMMSS.sql.gz
```

---

## Касса и `/install`

- UI кассы: `git-update.sh` → «Вид → Обновить» в приложении
- Electron (`.exe`/`.dmg`) — репозиторий `aurent-cashier-desktop`, CI заливает в `downloads/desktop/`
- Страница: `https://домен/install`

## SSL

Пример nginx на хосте: `nginx-host.conf.example` + Certbot.

## Порты

| Порт | Назначение |
|------|------------|
| 80 | Веб + nginx `/api` |
| 8080 | API напрямую (касса, health) |
| 5432 | Postgres (только внутри Docker) |
