# Aurent POS (postsystem)

Монолитная POS-система: веб-админка, API для кассы, PostgreSQL.

## Стек

| Часть | Технологии |
|-------|------------|
| Backend | Java 17, Spring Boot 3, PostgreSQL |
| Frontend | React, Vite (main + restaurant SPA) |
| Касса / SPA | Репозиторий [`aurent-frontend`](https://github.com/Timur1019/aurent-frontend) |
| Деплой | Docker Compose |

**Карта prod / что не ломать:** [`deploy/STACK-MAP.md`](deploy/STACK-MAP.md)

## Структура

```
postsystem/
├── contracts/frontend/          # снимки для backend CI sync-check
├── bots/
│   ├── telegram-support-bot/    # аптечный Telegram-бот
│   └── telegram-web-support-bot/# поддержка web/CRM
├── web-backend/                 # POS core API
├── restaurant-service/          # API ресторана (/rst)
├── deploy/                      # Деплой + STACK-MAP.md
├── docker-compose.yml
└── docker-compose.prod.yml
```


## Локальная разработка

```bash
# БД + API + фронт
docker compose up -d --build

# Или по отдельности:
cd web-backend && mvn spring-boot:run
cd ../aurent-frontend && pnpm install && pnpm run dev:web   # отдельный репо
```

API: `http://localhost:8080/api/v1`  
Веб: `http://localhost:5173` (Docker: порт 5173 → nginx 80)  
SPA: репозиторий `aurent-frontend` (`pnpm run dev:web` / `dev:restaurant` / `dev:pharmacy`)

Демо-логин после init БД: `admin` / `password`

## Production (Ubuntu + Docker)

**Деплой через Git** (после merge в `main`):

```bash
# на сервере
cd /opt/aurent-pos
bash deploy/update.sh
```

Первый раз на сервере:

```bash
sudo bash deploy/server-setup.sh ubuntu
bash deploy/update.sh bootstrap
bash deploy/server-setup.sh env
bash deploy/deploy.sh check
bash deploy/deploy.sh
```

Подробнее: [deploy/README.md](deploy/README.md) — 4 скрипта: `server-setup` · `update` · `deploy` · `backup`

| Порт | Назначение |
|------|------------|
| 80 | Веб-интерфейс |
| 8080 | API (касса + health) |

## Касса

Desktop: репозиторий **`aurent-frontend`** (`apps/desktop-electron`, `restaurant-desktop`, `pharmacy-desktop`).

Страница загрузки: **`/install`** (публичная, без входа).

В настройках Aurent Cashier укажите IP сервера и порт **80** (или **443** для HTTPS).

Проверка: `http://<server>/api/v1/actuator/health`

## Секреты

Не коммитьте `.env`. Шаблон: `.env.example`.
