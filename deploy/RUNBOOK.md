# Runbook — Aurent POS

Краткие действия при инцидентах. Не заменяет мониторинг, но помогает быстро восстановить работу.

## 1. Касса не открывает смену

1. Проверить интернет на кассе.
2. Desktop: перезапустить Aurent Cashier.
3. Браузер: обновить страницу, перелогиниться.
4. Админ → Кассы: касса привязана к магазину?
5. На сервере: `curl -fsS http://127.0.0.1:8080/api/v1/actuator/health`

## 2. API недоступен (502 / 503)

```bash
cd /opt/aurent-pos
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 backend
docker compose -f docker-compose.prod.yml restart backend api-gateway
```

Если не помогло — откат (см. раздел 6).

## 3. Ошибка после деплоя / Liquibase

```bash
docker compose -f docker-compose.prod.yml logs --tail=200 backend | grep -i liquibase
```

Не править БД вручную. Откатить на предыдущий коммит и пересобрать:

```bash
git log -3 --oneline
git checkout <previous-commit>
bash deploy/update.sh
```

## 4. Клиент не видит модуль в меню (весы, отчёты…)

1. Супер-админ → Доступы → включить модуль для пользователя.
2. Перелогиниться (JWT обновится).
3. Проверить синхронизацию: `node scripts/check-module-sync.mjs`

## 5. Finance sync outbox (зависшие записи)

Супер-админ → Мониторинг → блок «Finance outbox failed».

Или API (platform internal): retry pending через админ-панель finance sync.

## 6. Откат деплоя

```bash
cd /opt/aurent-pos
bash deploy/rollback.sh              # на 1 коммит назад
# или: bash deploy/rollback.sh abc1234
```

Скрипт сохраняет точку возврата в `logs/rollback.log`.

Ручной откат:

```bash
git log -5 --oneline
git reset --hard <stable-commit>
bash deploy/deploy.sh
```

## 7. Восстановление БД из бэкапа

```bash
cd /opt/aurent-pos
ls -lt backups/postgres/
bash deploy/backup.sh restore backups/postgres/pos_db_YYYYMMDD_HHMMSS.sql.gz
```

**Внимание:** перезаписывает текущую БД. Остановите backend перед restore (скрипт делает это сам).

## 8. Ежедневные проверки (5 минут)

- [ ] `bash deploy/backup.sh verify-latest` — бэкап целый
- [ ] `bash scripts/load-test.sh` — p95 < 2с (опционально)
- [ ] Перед релизом ресторана: `scripts/loadtest/README.md` — smoke → `peak2k` (staging); ёмкость: `deploy/CAPACITY-2000.md`
- [ ] `bash deploy/health-alert.sh` — без ошибок
- [ ] Супер-админ → Мониторинг — ошибок за 24ч в норме
- [ ] Последний бэкап не старше 24ч
- [ ] Место на диске < 85%

## 9. Настройка алертов в Telegram

**Ничего нового настраивать не нужно** — скрипт использует боты из вашего `.env`:

1. Веб-поддержка: `TELEGRAM_WEB_SUPPORT_BOT_TOKEN` + `TELEGRAM_WEB_SUPPORT_GROUP_ID`
2. Или аптечный бот: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_SUPPORT_GROUP_ID`

Отдельный бот только если нужен другой чат:

```env
OPS_ALERT_TELEGRAM_BOT_TOKEN=...
OPS_ALERT_TELEGRAM_CHAT_ID=...
```

Установить cron:

```bash
bash deploy/health-alert.sh install-cron
```

## 10. Sentry (опционально)

```env
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=production
VITE_SENTRY_DSN=https://...@sentry.io/...
```

Пересобрать frontend и backend. Без DSN — Sentry выключен, поведение как раньше.

## 11. Безопасность tenant

Клиент **не может** подменить `X-Company-Id` или `X-User-Roles` — gateway и сервисы берут данные из JWT.
Заголовок `X-Company-Id` принимается только у **SUPER_ADMIN** без company в токене (супер-админ панель).

## 12. Cutover pharmacy-service (pos_db → pharmacy_db)

Одноразовая миграция аптечных данных. После успеха убрать `POS_CORE_DATASOURCE_*`.

```bash
cd /opt/aurent-pos
# 1) В .env (или .env.staging) добавить POS_CORE_DATASOURCE_URL/USERNAME/PASSWORD
# 2) Миграция
COMPOSE_FILE=docker-compose.prod.yml ENV_FILE=.env \
  bash pharmacy-service/scripts/cutover-pharmacy.sh migrate-compose
# 3) Проверка counts
bash pharmacy-service/scripts/cutover-pharmacy.sh verify-compose
# 4) Убрать migrator env и пересоздать сервис
bash pharmacy-service/scripts/cutover-pharmacy.sh clear-migrate-env
```

Staging: `COMPOSE_FILE="docker-compose.prod.yml -f docker-compose.staging.yml" ENV_FILE=.env.staging`.

Локально: `MIGRATE=1 bash .local-run/start-pharmacy.sh`, затем
`bash pharmacy-service/scripts/verify-pharmacy-migration.sh`.

После verify — purge legacy из pos_db:

```bash
COMPOSE=1 bash pharmacy-service/scripts/purge-pharmacy-from-pos-db.sh --execute
```

Или одним флагом при деплое: `PHARMACY_CUTOVER=1 bash deploy/deploy.sh`.

## 13. HA (backend replicas + Kafka)

```bash
# 2× web-backend, один api-gateway (DNS round-robin на backend)
BACKEND_REPLICAS=2 bash scripts/ha-up.sh
```

Redpanda в prod больше не `dev-container`: persistent volume `redpanda_data`, `REDPANDA_SMP` / `REDPANDA_MEMORY`.
Внешний Kafka: задайте `KAFKA_BOOTSTRAP_SERVERS` в `.env`.
