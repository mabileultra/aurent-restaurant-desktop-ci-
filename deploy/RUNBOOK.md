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

- [ ] `bash deploy/smoke-check.sh` — без ошибок
- [ ] `bash deploy/backup.sh verify-latest` — бэкап целый
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
