# Aurent POS (postsystem)

Монолитная POS-система: веб-админка, API для кассы, PostgreSQL.

## Стек

| Часть | Технологии |
|-------|------------|
| Backend | Java 17, Spring Boot 3, PostgreSQL |
| Frontend | Vue 3, Vite, Bootstrap |
| Касса | Electron ([`aurent-cashier-desktop`](../aurent-cashier-desktop) — отдельный репозиторий) |
| Деплой | Docker Compose |

## Структура

```
postsystem/
├── web-backend/                 # REST API
├── web-frontend/                # Веб-интерфейс (менеджер/админ + UI кассы)
├── telegram-web-support-bot/    # Бот поддержки CRM/POS (страница «Поддержка»)
├── telegram-support-bot/        # Аптечный бот (поиск лекарств)
├── deploy/                      # Скрипты деплоя на Ubuntu
├── docker-compose.yml
└── docker-compose.prod.yml
```

## Локальная разработка

```bash
# БД + API + фронт
docker compose up -d --build

# Или по отдельности:
cd web-backend && mvn spring-boot:run
cd web-frontend && npm install && npm run dev
```

API: `http://localhost:8080/api/v1`  
Веб: `http://localhost:5173` (Docker: порт 5173 → nginx 80)

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

Desktop-приложение вынесено в соседний репозиторий **`../aurent-cashier-desktop`**.

```bash
cd ../aurent-cashier-desktop
bash scripts/start-cashier-desktop.sh   # из postsystem: bash scripts/start-cashier-desktop.sh
```

Страница загрузки: **`/install`** (публичная, без входа).

В настройках Aurent Cashier укажите IP сервера и порт **80** (или **443** для HTTPS).

Проверка: `http://<server>/api/v1/actuator/health`

## Секреты

Не коммитьте `.env`. Шаблон: `.env.example`.
