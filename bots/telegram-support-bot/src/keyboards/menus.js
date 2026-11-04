import { Markup } from 'telegraf';
import { MENU, RADIUS_OPTIONS_KM } from '../state/userStateStore.js';

export function mainMenuKeyboard() {
  return Markup.keyboard([
    [MENU.FIND, MENU.NEARBY],
    [MENU.FAVORITES, MENU.HISTORY],
    [MENU.SCAN, MENU.SUPPORT],
    [MENU.ABOUT],
  ]).resize();
}

export function homeKeyboard() {
  return Markup.keyboard([[MENU.HOME]]).resize();
}

export function backHomeKeyboard() {
  return Markup.keyboard([[MENU.BACK], [MENU.HOME]]).resize();
}

export function locationKeyboard() {
  return Markup.keyboard([
    [Markup.button.locationRequest(MENU.SEND_LOCATION)],
    [MENU.BACK],
    [MENU.HOME],
  ]).resize();
}

export function navInline({ back = null, home = true } = {}) {
  const row = [];
  if (back) row.push(Markup.button.callback('⬅️ Назад', back));
  if (home) row.push(Markup.button.callback('🏠 Главное меню', 'nav:home'));
  return row.length ? [row] : [];
}

export function searchResultButtons(items) {
  const rows = (items || []).slice(0, 10).map((item, i) => [
    Markup.button.callback(
      `💊 ${short(item.productName, 40)}`,
      `prod:${item.productId}`
    ),
  ]);
  rows.push(...navInline({ back: 'nav:search_prompt', home: true }));
  return Markup.inlineKeyboard(rows);
}

export function notFoundButtons() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔎 Повторить поиск', 'nav:search_prompt')],
    [Markup.button.callback('📷 Сканировать штрихкод', 'nav:barcode')],
    [Markup.button.callback('🆘 Сообщить о проблеме', 'nav:support')],
    [Markup.button.callback('🏠 Главное меню', 'nav:home')],
  ]);
}

export function productCardButtons(productId, { isFavorite = false } = {}) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🏪 Найти в аптеках', `stores:${productId}`)],
    [
      Markup.button.callback(
        isFavorite ? '⭐ В избранном' : '⭐ Добавить в избранное',
        isFavorite ? `unfav:${productId}` : `fav:${productId}`
      ),
    ],
    ...navInline({ back: 'back:search', home: true }),
  ]);
}

export function pharmacyListButtons(matches, productId) {
  const rows = (matches || []).slice(0, 10).map((m, i) => {
    const dist = m._distanceLabel ? ` — ${m._distanceLabel}` : '';
    return [
      Markup.button.callback(
        `🏪 ${short(m.storeName || 'Аптека', 28)}${dist}`.slice(0, 64),
        `pharm:${productId}:${m.storeId || i}`
      ),
    ];
  });
  rows.push(...navInline({ back: `prod:${productId}`, home: true }));
  return Markup.inlineKeyboard(rows);
}

export function pharmacyCardButtons(productId, store) {
  const rows = [];
  if (store?.address) {
    const q = encodeURIComponent(store.address);
    rows.push([Markup.button.url('🗺 Открыть на карте', `https://maps.google.com/?q=${q}`)]);
  }
  if (store?.phone) {
    const tel = String(store.phone).replace(/[^\d+]/g, '');
    if (tel) rows.push([Markup.button.url('📞 Позвонить', `tel:${tel}`)]);
  }
  rows.push(...navInline({ back: `stores:${productId}`, home: true }));
  return Markup.inlineKeyboard(rows);
}

export function nearbyStoreButtons(stores) {
  const rows = (stores || []).slice(0, 12).map((s, i) => {
    const dist = s._distanceLabel ? ` — ${s._distanceLabel}` : '';
    return [
      Markup.button.callback(
        `🏪 ${short(s.storeName || 'Аптека', 28)}${dist}`.slice(0, 64),
        `nstore:${s.storeId || i}`
      ),
    ];
  });
  rows.push(...navInline({ back: 'nav:nearby', home: true }));
  return Markup.inlineKeyboard(rows);
}

export function nearbyStoreCardButtons(store) {
  const rows = [];
  if (store?.address) {
    const q = encodeURIComponent(store.address);
    rows.push([Markup.button.url('🗺 Открыть на карте', `https://maps.google.com/?q=${q}`)]);
  }
  if (store?.phone) {
    const tel = String(store.phone).replace(/[^\d+]/g, '');
    if (tel) rows.push([Markup.button.url('📞 Позвонить', `tel:${tel}`)]);
  }
  rows.push(...navInline({ back: 'nav:nearby_list', home: true }));
  return Markup.inlineKeyboard(rows);
}

export function radiusButtons() {
  const rows = RADIUS_OPTIONS_KM.map((km) => [
    Markup.button.callback(`${km} км`, `radius:${km}`),
  ]);
  rows.push(...navInline({ back: 'nav:nearby', home: true }));
  return Markup.inlineKeyboard(rows);
}

export function favoritesButtons(favorites) {
  if (!favorites?.length) {
    return Markup.inlineKeyboard([[Markup.button.callback('🏠 Главное меню', 'nav:home')]]);
  }
  const rows = favorites.slice(0, 15).flatMap((f) => [
    [Markup.button.callback(`💊 ${short(f.productName, 40)}`, `prod:${f.productId}`)],
    [
      Markup.button.callback('🔎 Найти в аптеках', `stores:${f.productId}`),
      Markup.button.callback('❌ Удалить', `unfav:${f.productId}`),
    ],
  ]);
  rows.push([Markup.button.callback('🏠 Главное меню', 'nav:home')]);
  return Markup.inlineKeyboard(rows);
}

export function historyButtons(history) {
  const rows = (history || []).slice(0, 20).map((h, i) => [
    Markup.button.callback(`🕘 ${short(h.query, 48)}`, `hist:${i}`),
  ]);
  if (history?.length) {
    rows.push([Markup.button.callback('🗑 Очистить историю', 'hist:clear')]);
  }
  rows.push([Markup.button.callback('🏠 Главное меню', 'nav:home')]);
  return Markup.inlineKeyboard(rows);
}

export function supportCategoryButtons() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔎 Не нашёл лекарство', 'sup:not_found')],
    [Markup.button.callback('💰 Неверная цена', 'sup:bad_price')],
    [Markup.button.callback('📦 Неверный остаток', 'sup:bad_stock')],
    [Markup.button.callback('🏪 Проблема с аптекой', 'sup:store')],
    [Markup.button.callback('💻 Техническая проблема', 'sup:tech')],
    [Markup.button.callback('✍️ Другая проблема', 'sup:other')],
    [Markup.button.callback('🏠 Главное меню', 'nav:home')],
  ]);
}

export function ticketButtons(ticketId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📋 Статус', `tstat:${ticketId}`)],
    [Markup.button.callback('➕ Дополнить', `tadd:${ticketId}`)],
    [Markup.button.callback('✅ Закрыть', `tclose:${ticketId}`)],
    [Markup.button.callback('🏠 Главное меню', 'nav:home')],
  ]);
}

export function barcodeFailButtons() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📷 Попробовать ещё раз', 'nav:barcode')],
    [Markup.button.callback('🔎 Найти по названию', 'nav:search_prompt')],
    [Markup.button.callback('🏠 Главное меню', 'nav:home')],
  ]);
}

export function errorButtons(retryAction = 'nav:home') {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Повторить', retryAction)],
    [Markup.button.callback('🏠 Главное меню', 'nav:home')],
  ]);
}

function short(name, max = 40) {
  const s = String(name || '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
