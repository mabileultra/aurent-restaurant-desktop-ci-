# Bots

Telegram bots (separate Node packages, not root pnpm workspace members).

| Path | Role |
|------|------|
| `telegram-support-bot/` | Аптека: поиск лекарств + поддержка |
| `telegram-web-support-bot/` | Web/CRM: страница «Поддержка» |

Compose service names stay `telegram-support-bot` / `telegram-web-support-bot`; build context is `./bots/…`.
