# Capacity target: ~2 000 concurrent POS (one restaurant-service)

Без доп. реплик `restaurant-service`. Цель: пик ~2k официантов/касс, p95 меню/зала приемлемый.

## Что включено в prod compose

| Компонент | Было → стало |
|-----------|----------------|
| `restaurant-service` RAM | 1 Gi → **1.5 Gi** |
| Hikari | 10 → **40** (`RESTAURANT_HIKARI_MAX_POOL`) |
| Tomcat threads | default → **300** |
| Redis | 64 Mi → **256 Mi**, LRU |
| Redis у ресторана | выкл → **вкл** (меню/зал cache) |
| `restaurant-db` | 192 Mi → **768 Mi**, `max_connections=120` |
| `api-gateway` | 640 Mi → **896 Mi** |

## Фронт POS

Реже поллинг заказа/меню/счётчика/кухни (см. `useFloorPosPage` / `useKitchenPosPage`).

## Проверка

```bash
LOAD_TEST_TOKEN=… STORE_ID=… PROFILE=peak2k \
  BASE_URL=https://STAGING/api/v1 \
  bash scripts/load-test-restaurant-peak.sh
```

Pass: ошибки &lt;10%, p95 тика &lt;5 с.

## Дальше (когда 2k мало)

Реплики `restaurant-service`, read-replica Postgres, CDN фото — отдельная задача.
