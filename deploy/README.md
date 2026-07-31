# Деплой Aurent POS

## Схема (основной путь)

```
push main → GitHub Actions (deploy-web.yml)
         → SSH на сервер → git-update.sh → deploy.sh → Docker
```

На сервере вручную то же самое: `bash deploy/git-update.sh`.

---

## Уровень 1 — критично (нужно всегда)

| Скрипт | Когда |
|--------|--------|
| `ubuntu-prepare.sh` | **Один раз** на чистом Ubuntu: Docker, UFW |
| `git-bootstrap.sh` | **Один раз**: клон/инициализация git в `/opt/aurent-pos` |
| `setup-env.sh` | **Один раз**: создать `.env` из `.env.example` |
| `prod-check.sh` | Перед первым деплоем: JWT, пароли, Docker |
| `deploy.sh` | Сборка и запуск `docker-compose.prod.yml` |
| `git-update.sh` | **Каждое обновление**: `git pull` + `deploy.sh` |
| `backup-db.sh` | Бэкап Postgres (CI делает перед деплоем) |
| `restore-db.sh` | Восстановление из дампа |
| `install-backup-cron.sh` | Cron бэкапа в 03:00 |
| `ci-ssh-setup.sh` | Только GitHub Actions (SSH-ключ) |

Скрипт поднимает полный стек:

```
postgres + identity/platform/reporting/finance/crm DB + redpanda
  → finance-service → backend → identity/platform/reporting/crm
  → api-gateway → frontend
```

**Первый запуск на сервере:**

```bash
cd /opt/aurent-pos
sudo bash deploy/ubuntu-prepare.sh
bash deploy/setup-env.sh && nano .env
bash deploy/prod-check.sh
bash deploy/deploy.sh
```

**Каждое обновление:**

```bash
cd /opt/aurent-pos
bash deploy/git-update.sh
```

Или с Mac: merge в `main` → CI сам деплоит (secrets: `DEPLOY_SSH_KEY_B64`, `DEPLOY_HOST`, `DEPLOY_USER`).

**Вспомогательные (вызываются из deploy.sh):**

- `docker-recreate-service.sh` — пересоздать один сервис
- `verify-db.sh` — пароль `.env` совпадает с Postgres
- `sync-db-password.sh` — починить пароль БД из `.env`

**Проверка:**

```bash
curl -s http://localhost/api/v1/actuator/health
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## Уровень 2 — опционально (редко)

Папка `deploy/optional/` — запасные сценарии, не для ежедневной работы.

| Скрипт | Когда нужен |
|--------|-------------|
| `optional/remote-update.sh` | Деплой с Mac по SSH без ожидания CI |
| `optional/sync-to-server.sh` | Rsync вместо git (старый способ) |
| `optional/recover-prod.sh` | Backend упал: синхрон пароля + recreate |
| `optional/migrate-db.sh` | Legacy SQL без рестарта backend (Liquibase — основной путь) |

```bash
# Деплой с Mac напрямую
bash deploy/optional/remote-update.sh root@IP

# Legacy миграции (обычно не нужно)
bash deploy/optional/migrate-db.sh
RUN_LEGACY_MIGRATE=1 bash deploy/deploy.sh
```

---

## Секреты `.env`

Обязательно на сервере (не в git):

- `POSTGRES_PASSWORD`
- `JWT_SECRET` (≥ 32 символов)
- `AI_ASSISTANT_API_KEY` (если ассистент включён)
- `FINANCE_DB_PASSWORD`, `FINANCE_INTERNAL_API_KEY` (если finance включён)

---

## Касса и `/install`

- UI кассы обновляется через `git-update.sh` → «Вид → Обновить» в приложении
- Electron (`.exe`/`.dmg`) — отдельный репозиторий `aurent-cashier-desktop`, CI заливает в `downloads/desktop/`
- Страница загрузки: `https://домен/install`

---

## Бэкапы

```bash
bash deploy/backup-db.sh
bash deploy/install-backup-cron.sh
bash deploy/restore-db.sh backups/postgres/pos_db_YYYYMMDD_HHMMSS.sql.gz
```

---

## SSL

Пример nginx на хосте: `nginx-host.conf.example` + Certbot.

## Порты

| Порт | Назначение |
|------|------------|
| 80 | Веб + nginx `/api` |
| 8080 | API напрямую (касса, health) |
| 5432 | Postgres (только внутри Docker) |
