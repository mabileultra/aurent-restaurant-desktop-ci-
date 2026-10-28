# Acceptance — restaurant desktop (edge)

Prereqs: cloud deploy with `edge-staff-export`, `catalog-export`, `sync/ingest`. Local: `scripts/prepare-restaurant-desktop.sh`, Postgres via `docker-compose.restaurant-edge.yml`.

1. Start edge DB + desktop (`RESTAURANT_CLOUD_API_URL=https://r-aurent.uz/api/v1 pnpm start`).
2. First admin login (online) → staff + catalog + stock copied.
3. Disconnect uplink → open table → dishes → kitchen → print → cash pay.
4. Card/OFD fail path → item stays in OFD queue; **no silent send**.
5. Restore uplink → status strip shows queue → confirm «Отправить в ОФД?» → Да.
6. Sync button / auto-push → cloud has **one** order, no duplicate lines.
7. Optional: `RESTAURANT_LAN_HUB=1` → second device on Wi‑Fi opens hall UI via this PC IP.
