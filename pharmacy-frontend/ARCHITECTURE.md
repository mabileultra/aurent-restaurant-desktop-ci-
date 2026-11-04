# Pharmacy frontend — архитектура

## Роли продуктов

| Поверхность | Домен | Кто пользуется |
|-------------|-------|----------------|
| `pharmacy-frontend` → **p-aurent.uz** | UI аптеки | кассир, менеджер аптеки |
| `restaurant-frontend` → **r-aurent.uz** | UI заведения | официант, кухня, менеджер |
| `web-frontend` → **aurent.uz** | платформа / grocery / super-admin | платформа, розница |
| Backend services | данные и auth | все фронты |

**Правило:** аптечный UI делаем только здесь. Main фронт для pharmacy после cutover не расширяем — только handoff + platform.

## Границы (Sprint 1+)

### Разрешено

- `src/pharmacy/**` — домен (POS, stock, ASL, returns, dashboard)
- `src/api/**` — HTTP к gateway / pharmacy-service / identity
- Auth bootstrap + безопасный Identity handoff (не JWT в URL)
- Собственный AppShell / router / Docker image

### Запрещено

- Копировать весь `web-frontend`
- Grocery / restaurant / platform-admin UI
- Удалять старый `/pharm` на aurent до offline drain + cutover
- Prod cutover без явного подтверждения

## Offline

Разные origin = разные IndexedDB/SW. Cutover только после синхронизации очереди на старом клиенте.

## Handoff

Целевой протокол: one-time code через Identity (audience=`pharmacy`), обмен на сессию. Не копировать `#handoff=` с JWT из restaurant без замены.
