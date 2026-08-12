# Aurent Telegram — аптечный бот (по компаниям)

Каждая аптечная **компания** получает своего бота. Бот показывает только магазины этой компании.

**Не путать** с `telegram-web-support-bot` (поддержка CRM/POS).

## Как работает

1. В CRM (ADMIN): `PUT /api/v1/company-telegram-bot` — токен BotFather + группа
2. Backend хранит привязку `api_token → company_id`
3. Runner (`telegram-support-bot`) поднимает все enabled-боты из БД

## Env (сервер)

```bash
# Master-токен для загрузки списка ботов из backend
TELEGRAM_BOT_RUNTIME_TOKEN=long-random-secret

# Legacy (одна компания без БД):
# TELEGRAM_BOT_TOKEN=...
# TELEGRAM_BOT_API_TOKEN=...
# TELEGRAM_BOT_COMPANY_ID=123   # обязательно! иначе API откажет
# TELEGRAM_SUPPORT_GROUP_ID=...
```

Backend:

```bash
TELEGRAM_BOT_RUNTIME_TOKEN=тот-же-секрет
# legacy optional:
TELEGRAM_BOT_API_TOKEN=...
TELEGRAM_BOT_COMPANY_ID=123
```

## API компании

```http
PUT /api/v1/company-telegram-bot
Authorization: Bearer …
{
  "botUsername": "claudia_pharm_bot",
  "botToken": "123:ABC...",
  "supportGroupId": "-100...",
  "enabled": true
}
```

После сохранения runner подхватит бота (рестарт контейнера или следующий деплой).

## Команды бота

- `/start` `/find` `/nearby` `/favorites` `/history` `/support` `/help`
