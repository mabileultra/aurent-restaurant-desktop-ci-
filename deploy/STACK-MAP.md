# Карта стека Aurent (не ломать)

Актуально на **2026-09-21**. Источник правды для фаз ресторана.

## Домены (prod)

| Домен | Что | Контейнер | Порт на хосте |
|-------|-----|-----------|---------------|
| **https://aurent.uz** | Main SPA (платформа, grocery POS, pharmacy, finance, лендинг) | `aurent-pos-frontend` | `8088→80` |
| **https://r-aurent.uz** | Restaurant SPA (зал, кухня, админка ресторана) | `aurent-restaurant-frontend` | `5174→80` |
| API | Gateway | `aurent-api-gateway` | `8080` |

Host nginx: `/etc/nginx/sites-available/aurent-pos` → upstreams `8088` / `5174`.

Handoff: PIN/login на aurent → при `VITE_RESTAURANT_APP_URL` → `r-aurent.uz/auth/accept#handoff=…`.

---

## Фронты (репозиторий)

| Каталог | Назначение | Dev | Prod |
|---------|------------|-----|------|
| `web-frontend` | Main SPA | `:5173` | aurent.uz |
| `restaurant-frontend` | Restaurant SPA | `:5174` | r-aurent.uz |
| `desktop-electron` | Оболочка кассы → грузит aurent (потом handoff на r-aurent) | — | установщик |

### Legacy (пока не удалять целиком)

| Что | Где | Статус |
|-----|-----|--------|
| Дубль restaurant UI | `web-frontend/src/restaurant` (~115 файлов) | Ещё смонтирован в `AppRoutes` как `/rst/*` **fallback**, если `VITE_RESTAURANT_APP_URL` пуст |
| Старый Electron | `aurent-cashier-desktop` | Не трогать без отдельной задачи |

**Правило удаления:** экран живёт и принят на **r-aurent** → только тогда убираем дубль из `web-frontend/src/restaurant` (по одному экрану/папке, не всё сразу).

---

## Бэкенды (compose)

| Сервис | Роль | Порт (внутри) |
|--------|------|----------------|
| `api-gateway` | Маршрутизация `/api/v1` | 8080 |
| `backend` (`web-backend`) | POS core: продажи, склад grocery, каталог | 8080 |
| `identity-service` | Auth, users | 8081 |
| `finance-service` | Финансы | 8082 |
| `crm-service` | CRM | 8083 |
| `platform-service` | Компании, billing, platform | 8084 |
| `reporting-service` | Отчёты | 8085 |
| `ai-service` | AI | 8086 |
| `restaurant-service` | Ресторан `/rst/**` (зал, меню, KDS, оплата…) | 8087 |
| `pharmacy-service` | Аптека | 8089 |

Склад/номенклатура ингредиентов сейчас = **Product в web-backend**, recipes в restaurant-service ссылаются на `productId`.

---

## Safe zones — не ломать без явной задачи

1. **Cashier PIN** — `web-frontend` `/cashier/login` + Electron  
2. **Grocery POS** — `/cashier/pos` на aurent.uz  
3. **Pharmacy** — pharmacy routes + `pharmacy-service`  
4. **Platform / SUPER_ADMIN** — только aurent.uz  
5. **Finance** — finance UI + `finance-service`  
6. **Restaurant floor / kitchen** — только **r-aurent.uz** (`/rst/pos`, `/rst/kitchen`) + `restaurant-service`  
7. **CORS / VITE handoff** — `VITE_RESTAURANT_APP_URL`, `VITE_MAIN_APP_URL`, `APP_CORS_ALLOWED_ORIGIN_PATTERNS`

При любой фазе: если правка не в зоне фазы — **не трогать**. После фазы — smoke: aurent login, grocery POS, r-aurent login/pos (если есть филиал).

---

## Фазы ресторана (кратко)

0. Карта + правило удаления (этот файл)  
1. Номенклатура на r-aurent  
2. Техкарты ← номенклатура (не MenuItem)  
3. Склад ресторана  
4. Меню = sellable UI  
5. Заказы + касса (mixed/split/returns)  
6. Dashboard / отчёты / настройки  
7. Удалить весь `web-frontend/src/restaurant`

Одна фаза за раз. Не смешивать с grocery/pharmacy/finance рефакторингом.

---

## Prod checklist (последняя проверка сервера)

- Git на сервере: смотреть `cd /opt/aurent-pos && git log -1 --oneline`
- 24/24 compose сервисов Up
- `https://aurent.uz` → title Aurent  
- `https://r-aurent.uz` → title Aurent Restaurant  
- Health: `http://127.0.0.1:8080/api/v1/actuator/health` → UP  

**Заметка:** в `.env` на сервере могут отсутствовать явные `VITE_*` / `APP_CORS` — тогда берутся defaults из `docker-compose.prod.yml` **на момент build**. После смены VITE — обязателен rebuild `frontend` и/или `restaurant-frontend`.
