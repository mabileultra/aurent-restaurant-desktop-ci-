# Restaurant / POS load tests

## Как проверяем (чеклист)

1. **Где:** только localhost или staging. Прод — нет (скрипт режет `r-aurent` без `CONFIRM_PROD_LOAD=1`).
2. **Что нужно:** `BASE_URL` + JWT кассира/админа + `STORE_ID`.
3. **Ступень A — smoke** (`PROFILE=smoke`): ~50 тиков. Ошибки &lt;5%, p95 &lt;1.5с → ок.
4. **Ступень B — peak2k** (`PROFILE=peak2k`): цель текущего одного инстанса (~2k). Ошибки &lt;10%, p95 &lt;5с → ок.
5. **Ступень C — peak10k** (позже, с репликами): только если B зелёный.
6. **Параллельно руками:** открыть кассу + меню; клики не залипают &gt;2–3с.
7. **Прод:** только после green A→B (и C если гоняли).

## What we measure

| Layer | Tool | Peak meaning |
|-------|------|----------------|
| API (касса / меню / зал) | `k6-restaurant-pos.js` or `load-test-restaurant-peak.sh` | Many concurrent GETs like idle POS UI |
| Gateway health only | `scripts/load-test.sh` | Smoke, safe anywhere |
| Frontend buttons | not 10k HTTP | UI freezes when **API p95** grows; check DevTools Network under k6 |

**10 000** = либо ~10k тиков bash (`LOAD_TEST_REQUESTS=10000`), либо профиль k6 `peak10k` (сотни VU × минуты ≈ десятки тысяч запросов).

## Never

- Не гонять `peak` / `peak10k` на **production** без явного окна и бэкапа.
- Не слать POST оплаты / create order в нагрузку — только read-path.

## k6 (предпочтительно)

```bash
brew install k6

# smoke
k6 run scripts/loadtest/k6-restaurant-pos.js \
  -e BASE_URL=http://127.0.0.1:8080/api/v1 \
  -e TOKEN='…' -e STORE_ID=59 -e PROFILE=smoke

# пик ~10k-класса
k6 run scripts/loadtest/k6-restaurant-pos.js \
  -e BASE_URL=https://STAGING/api/v1 \
  -e TOKEN='…' -e STORE_ID=59 -e PROFILE=peak10k
```

Pass: error rate и p95 в thresholds скрипта.

## bash (без k6)

```bash
# 200 тиков × 3 GET (меню + revision + floor)
LOAD_TEST_TOKEN='…' STORE_ID=59 \
  bash scripts/load-test-restaurant-peak.sh

# 10 000 тиков, concurrency 100
LOAD_TEST_TOKEN='…' STORE_ID=59 \
  LOAD_TEST_REQUESTS=10000 LOAD_TEST_CONCURRENCY=100 \
  PROFILE=peak \
  bash scripts/load-test-restaurant-peak.sh
```

Каждый тик = меню + категории + floor-revision + floor (4 GET).

## Pass / fail (рекомендация перед продом)

| Метрика | Warn | Fail |
|---------|------|------|
| HTTP errors | >5% | >10% |
| p95 одного тика | >1.5s | >5s |
| CPU DB / Java | — | >85% устойчиво |
| 5xx gateway | любые всплески | стоп |

## Перед деплоем

1. Staging: `PROFILE=smoke` → `peak` → при необходимости `peak10k`.
2. Смотреть логи `restaurant-service` / Hikari / Redis.
3. В браузере: касса + меню при идущем k6 — клики не должны «залипать» дольше 2–3 с.
4. Только после green — прод.
