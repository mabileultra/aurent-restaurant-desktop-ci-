# Restaurant frontend — архитектура

## Роли продуктов

| Поверхность | Домен | Кто пользуется |
|-------------|-------|----------------|
| `restaurant-frontend` → **r-aurent.uz** | UI заведения | официант, повар, менеджер ресторана |
| `web-frontend` → **aurent.uz** | платформа / супер-админ / розница / аптека | супер-админ, другие бизнесы |
| Backend services | данные и auth | оба фронта |

**Правило:** ресторанный UI делаем только здесь. Main фронт для ресторана не расширяем.  
`web-frontend/src/restaurant` удалим **потом**, когда этот SPA самодостаточен.  
Супер-админ (компании, магазины, юзеры) остаётся на main + backend.

---

## Границы кода (жёстко)

### Разрешено в `restaurant-frontend`

- `src/restaurant/**` — домен (зал, кухня, меню, смены, брони, доставка, админ)
- `src/components/ui/**` — Base UI-kit (единственный источник кнопок/полей/модалок)
- `src/components/shared/**` — оболочка приложения (auth bootstrap, toaster, theme)
- `src/api/**` — HTTP к своему backend (identity / restaurant / pos core)
- `src/features/auth/**` — login / accept session
- `src/styles/tokens/**` + `src/styles/ui/**` — токены и стили Base UI

### Запрещено

- pharmacy / finance / scales / platform-admin UI
- копировать grocery-каталог «как есть» из main
- inline-стили в страницах (кроме редких динамических координат canvas)
- новые «сырые» кнопки/`<input>` мимо `Base*`
- трогать `web-frontend` ради ресторанных экранов

### Временно

- `src/features/{stock,catalog,billing,reports}` — placeholder до своих экранов
- Handoff на main **не используем**

---

## Структура папок

```
src/
  api/                 # client + *.api.js
  components/
    ui/                # BaseButton, BaseInput, BaseModal, BaseTable, Page*
    shared/            # Auth*, Toaster, BrandMark…
  config/              # brand, env helpers
  features/            # тонкие фичи вне restaurant/ (auth, stubs)
  restaurant/
    app/               # routes, guards, admin layout/nav
    pos/               # floor + kitchen UI
    admin/             # back-office pages/hooks/components
    api/               # restaurant domain API
    shared/            # rst tokens, shared hooks
  hooks/               # app-level (tenant, stores, viewport)
  router/
  store/               # zustand
  styles/
    tokens/            # breakpoints, colors, spacing, touch, shell
    ui/                # CSS Base-компонентов (BEM)
  utils/
  locales/
```

Один экран = page + hook + css рядом (не всё в одном файле).

---

## Base UI (обязательно)

Импорт только из `components/ui`:

- `BaseButton` — primary / secondary / danger / ghost · sm / md / lg
- `BaseInput` — label + error
- `BaseSelect`
- `BaseModal`
- `BaseTable`
- `PageLayout` / `PageHeader` / `PageSearchField`
- `ErrorBanner` / `EmptyState`

Стили: `styles/ui/*.css`, методология **BEM** (`base-btn`, `base-btn--primary`).

---

## Адаптив (сразу)

Эталон POS: **1024×768**.

| Профиль | Условие | `html` class |
|---------|---------|--------------|
| `compact` | width ≤ 799 | `app-viewport--compact` |
| `desktop` | width ≥ 1024 | `app-viewport--desktop` |
| `canonical` | 1024–1280 × height ≤ 820 | `app-viewport--canonical` |

Источник правды: `utils/viewportBreakpoints.js` + `styles/tokens/breakpoints.css`.  
Класс на `<html>` ставит `AppViewportSync`.

Touch: `--touch-min` ≥ 44px (POS ≥ 48px).

---

## Размер файлов (жёстко)

**Максимум 300 строк** на `.js` / `.jsx` в `src/`.

Делить всегда так:

| Слой | Пример |
|------|--------|
| page | `MenuAdminPage.jsx` — только JSX |
| hook | `useMenuAdminPage.js` — состояние / запросы |
| utils | чистые функции |
| css | отдельный BEM-файл |

Проверка: `npm run check:size`

---

## Тесты (всегда)

- Пишем тесты **на каждую новую логику** (utils, hooks-логика, API mappers, fiscal).
- Тесты **только** в папке `test/`, зеркало `src/`:

```
src/utils/appHomePath.js
test/utils/appHomePath.test.js

src/services/multikassa/foo.js
test/services/multikassa/foo.test.js
```

- В `src/` файлов `*.test.js` **не держим**.
- Запуск: `npm test` (vitest, `test/**/*.test.js`)

---

## Backend

Auth / JWT / tenant scope — общие API.  
Новые ресторанные операции — `restaurant-service` (или существующие rst endpoints), не дублировать UI в main.
