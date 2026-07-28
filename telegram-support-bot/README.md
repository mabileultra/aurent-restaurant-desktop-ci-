# Telegram-бот Aurent POS

Бот умеет:
1. **Искать лекарства** по названию или штрихкоду во всех магазинах (цена, остаток, адрес, телефон).
2. **Принимать обращения** в поддержку и пересылать их в группу.

## Настройка

1. Создайте бота через [@BotFather](https://t.me/BotFather), получите токен.
2. Создайте группу в Telegram, добавьте бота в группу **как администратора**.
3. Узнайте `chat.id` группы:
   - Напишите любое сообщение в группу.
   - Откройте: `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
   - Найдите `"chat":{"id":-100...}` — это `TELEGRAM_SUPPORT_GROUP_ID`.
4. Придумайте секрет `TELEGRAM_BOT_API_TOKEN` (один и тот же в backend и в боте).
5. Скопируйте `.env.example` в корневой `.env` и заполните переменные.

## Запуск

### Production (сервер, Docker)

В корневом `.env` на сервере:

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_SUPPORT_GROUP_ID=-100...
TELEGRAM_BOT_API_TOKEN=long-random-secret
# опционально — только одна компания:
# TELEGRAM_BOT_COMPANY_ID=1
VITE_SUPPORT_TELEGRAM_BOT=your_bot_username
```

```bash
cd /opt/aurent-pos
bash deploy/deploy.sh
# или только бот + backend:
docker compose -f docker-compose.prod.yml up -d --build backend telegram-support-bot
docker compose -f docker-compose.prod.yml logs -f telegram-support-bot
```

### Локально (разработка)

```bash
cd telegram-support-bot
cp .env.example .env
# заполните TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_API_TOKEN, TELEGRAM_BOT_BACKEND_URL
npm install
npm start
```

Для разработки с автоперезагрузкой: `npm run dev`.

## Поведение

- `/start` — меню: поиск лекарств + поддержка
- текст (название / штрихкод) или `/find парацетамол` — поиск по магазинам
- `/support` — режим поддержки (текст/фото/документ → группа)

## Backend API

Бот вызывает:

`GET /api/v1/public/bot/medicine/search?q=...`

с заголовком `X-Bot-Token: <TELEGRAM_BOT_API_TOKEN>`.

## Связь с веб-приложением

В сборке фронтенда задайте:

- `VITE_SUPPORT_PHONE` — телефон на странице «Поддержка»
- `VITE_SUPPORT_TELEGRAM_BOT` — username бота без `@`
