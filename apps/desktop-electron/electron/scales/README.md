# Весы (Electron)

Отдельный модуль для USB/RS-232 весов в десктоп-кассе.

## Файлы

| Файл | Назначение |
|------|------------|
| `scale-parser.cjs` | Разбор строк с весов → кг |
| `scale-serial-port.cjs` | Обёртка над `serialport` (опционально) |
| `scale-mock.cjs` | Эмуляция веса без железа |
| `scale-shtrih-packet.cjs` | Кадры 0x50 / 0x11 |
| `scale-shtrih-udp-bind.cjs` | Local UDP **2000** |
| `scale-shtrih-udp-io.cjs` | Probe / push / poller + retry |
| `scale-shtrih-udp.cjs` | Фасад push/probe |
| `scale-shtrih-discover.cjs` | Known IP → скан LAN |
| `scale-adapters.cjs` | Семейства + probeDevices + PLU |
| `scale-config.cjs` | `config.json` (+ `scalePassword`) |
| `scale-manager.cjs` | Сессия, события в UI |
| `scale-auto-detect.cjs` | COM + Ethernet |
| `scale-picker-window.cjs` | Окно настройки |
| `index.cjs` | IPC для `preload.cjs` |

## Автонастройка (COM + Ethernet)

1. **COM/USB:** драйвер Windows → `COM3` и т.п.
2. **Ethernet (ШТРИХ-ПРИНТ):** UDP **1111** на весах; ПК шлёт с локального UDP **2000** (как Лайтбокс/Saby).
3. Автопоиск: сначала известные IP (`config` + `192.168.0.202`) → скан /24 UDP 1111 → TCP fallback.
4. Перед выгрузкой PLU — **проверка связи** (`0x11`) по всем сохранённым весам; offline пропускаются.
5. Успех → `config.json` (`scaleHosts`, `scalePassword`, …).

Если 2000 занят — fallback на ephemeral порт.

## Настройка вручную

В `%APPDATA%/Aurent Cashier/config.json` (или userData на Mac):

```json
{
  "scalePort": "COM3",
  "scaleBaudRate": 9600,
  "scaleStableOnly": true
}
```

Или переменные окружения:

- `POS_SCALE_PORT=COM3`
- `POS_SCALE_BAUD=9600`
- `POS_SCALE_PASSWORD=0030`
- `POS_SCALE_LOCAL_UDP_PORT=2000`
- `POS_SCALE_HOST=192.168.0.202` — подсказка автопоиску
- `POS_SCALE_MOCK=1` — фейковый вес без железа
- `POS_SCALE_MOCK_UDP=1` — вес/PLU на `127.0.0.1:1111`

## Зависимость

```bash
cd desktop-cashier
npm install serialport @serialport/parser-readline --save-optional
npm run rebuild:native
```

Без `serialport` вкладка «Весы» в модалке покажет подсказку по установке.

## Фронт

`web-frontend/src/scales/` — мост и хук `useScaleWeight`.  
Коды PLU: проверка связи, пароль, last sync, выгрузка.

## Чеклист «весы не находятся»

1. Весы в меню: Интерфейс → **Ethernet**, IP в той же LAN, UDP **1111**.
2. Кабель через роутер/свитч (не «напрямую» комплектным патчем без свитча).
3. Windows Firewall: разрешить UDP **исходящий 1111** и локальный **2000**.
4. В Aurent → Весы: «Найти в сети» или вручную IP; «Проверить».
5. Пароль PLU **0030** (или свой в Коды PLU); после 5 ошибок — перезагрузить весы.
6. Без железа: `node electron/scales/scale-shtrih-mock.cjs` + host `127.0.0.1`.
