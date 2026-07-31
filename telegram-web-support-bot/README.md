# Aurent POS — бот поддержки веб-приложения

Отдельный бот для страницы «Поддержка» в CRM/POS.

**Не путать** с `telegram-support-bot` — тот для аптеки (поиск лекарств + своя поддержка).

## Env

| Переменная | Назначение |
|------------|------------|
| `TELEGRAM_WEB_SUPPORT_BOT_TOKEN` | Токен от @BotFather |
| `TELEGRAM_WEB_SUPPORT_GROUP_ID` | Группа для обращений |
| `TELEGRAM_WEB_SUPPORT_DATA_DIR` | Данные тикетов (по умолчанию `./data`) |

На фронте username этого бота:

```
VITE_SUPPORT_TELEGRAM_BOT=your_pos_support_bot
```

## Команды

- `/start` — приветствие и категории
- `/support` — открыть поддержку
- `/help` — краткая справка

Сотрудник отвечает в группе **Reply** на сообщение бота → ответ уходит пользователю в личку.
