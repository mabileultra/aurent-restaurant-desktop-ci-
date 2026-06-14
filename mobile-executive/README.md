# Aurent Executive — мобильное приложение для руководителей

React Native (Expo) приложение для директоров и учредителей: продажи, прибыль, деньги, динамика.

**Языки:** русский, узбекский (без английского).

## Требования

- Node.js 20.19+ (рекомендуется)
- npm
- Expo Go (для теста) или EAS CLI (для сборки в Store)
- Запущенный backend: `web-backend` + `finance-service`

## Быстрый старт (разработка)

```bash
cd mobile-executive
cp .env.example .env   # уже настроен на https://www.aurent.uz/api/v1

npm install
npm start
```

Отсканируйте QR в **Expo Go** на телефоне. Нужен интернет — приложение ходит на production API Aurent.

### Адрес сервера (по умолчанию)

**Production:** `https://www.aurent.uz/api/v1`

Проверка API: `https://www.aurent.uz/api/v1/actuator/health`

Вход — те же **код компании**, **логин** и **пароль**, что на сайте Aurent (роль ADMIN или MANAGER).

На экране входа можно сменить URL (раскрыть «Адрес сервера») — только для теста на локальном backend.

## API (backend)

Приложение использует существующие endpoints:

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/v1/auth/login` | Вход (код компании + логин + пароль) |
| POST | `/api/v1/auth/refresh` | Обновление JWT |
| GET | `/api/v1/finance/executive/summary` | Сводка для мобилки |

Роли: `ADMIN`, `MANAGER`.

## Сборка для App Store / Google Play

### 1. Установите EAS CLI

```bash
npm install -g eas-cli
eas login
```

### 2. Создайте проект EAS

```bash
cd mobile-executive
eas init
```

Скопируйте `projectId` в `app.json` → `extra.eas.projectId`.

### 3. Production URL

Перед сборкой задайте production API в `.env`:

```env
EXPO_PUBLIC_API_URL=https://www.aurent.uz/api/v1
```

### 4. Сборка

```bash
# Android (AAB для Play Store)
npm run build:android

# iOS (для App Store — нужен Apple Developer аккаунт)
npm run build:ios
```

### 5. Публикация

```bash
eas submit --platform android
eas submit --platform ios
```

## Bundle ID / Package

- iOS: `com.aurent.executive`
- Android: `com.aurent.executive`

Измените в `app.json` при необходимости перед первой публикацией.

## Структура

```text
mobile-executive/
├── app/                 # Экраны (Expo Router)
├── src/
│   ├── api/             # HTTP клиент, auth, executive
│   ├── components/      # UI по экранам
│   ├── hooks/           # useAuth, useExecutiveSummary
│   ├── i18n/            # ru.json, uz.json
│   ├── theme/           # Цвета, отступы
│   └── storage/         # SecureStore (JWT)
├── app.json             # Конфиг Expo
└── eas.json             # Профили сборки
```

## Перенос в отдельный репозиторий

Папку `mobile-executive/` можно скопировать целиком в новый git-репозиторий.
Backend остаётся в основном проекте — меняется только `EXPO_PUBLIC_API_URL`.
