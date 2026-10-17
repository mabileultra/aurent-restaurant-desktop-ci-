# Весы (Electron)

Отдельный модуль для USB/RS-232 весов в десктоп-кассе.

## Файлы

| Файл | Назначение |
|------|------------|
| `scale-parser.cjs` | Разбор строк с весов → кг |
| `scale-serial-port.cjs` | Обёртка над `serialport` (опционально) |
| `scale-mock.cjs` | Эмуляция для разработки |
| `scale-config.cjs` | `config.json`: порт, скорость |
| `scale-manager.cjs` | Сессия, события в UI |
| `scale-auto-detect.cjs` | Поиск COM и проверка ответа весов |
| `scale-picker-window.cjs` | Окно настройки (как принтер) |
| `index.cjs` | IPC для `preload.cjs` |

## Автонастройка (COM + Ethernet)

1. **COM/USB:** драйвер Windows → `COM3` и т.п.
2. **Ethernet (ШТРИХ-ПРИНТ и др.):** весы и касса в одной LAN; типичные TCP-порты (1001, 1111, …).
3. В кассе: меню **Aurent → «Весы»** → **«Найти автоматически»** — сначала COM, потом скан сети.
4. Успех пишется в `config.json` (`scaleTransport`, `scalePort` или `scaleHost`/`scaleTcpPort`) — следующий запуск подключается **сам**.

Если ничего не сохранено, при старте прослушивания тот же автопоиск запускается сам.

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
- `POS_SCALE_MOCK=1` — тест без железа

## Зависимость

```bash
cd desktop-cashier
npm install serialport @serialport/parser-readline --save-optional
npm run rebuild:native
```

Без `serialport` вкладка «Весы» в модалке покажет подсказку по установке.

## Фронт

`web-frontend/src/scales/` — мост и хук `useScaleWeight`.
