# Aurent Telegram — аптечный бот

Мини-приложение для **аптеки**:
- поиск лекарств, аптеки рядом, избранное, история
- своя поддержка (категории про лекарства / остатки)

**Не путать** с `telegram-web-support-bot` — тот для страницы «Поддержка» в веб-CRM/POS.

На фронте username **этого** бота в `VITE_SUPPORT_TELEGRAM_BOT` ставить **нельзя**.

## Env

| Переменная | Назначение |
|------------|------------|
| `TELEGRAM_BOT_TOKEN` | Токен аптечного бота |
| `TELEGRAM_SUPPORT_GROUP_ID` | Группа поддержки аптеки |
| `TELEGRAM_BOT_API_TOKEN` | Секрет для backend API |
| `TELEGRAM_BOT_BACKEND_URL` | URL backend |
| `TELEGRAM_BOT_DATA_DIR` | Данные (по умолчанию `./data`) |

## Команды

- `/start` — главное меню
- `/find` — поиск
- `/nearby` — аптеки
- `/favorites` — избранное
- `/history` — история
- `/support` — поддержка аптеки
- `/help` — о сервисе
