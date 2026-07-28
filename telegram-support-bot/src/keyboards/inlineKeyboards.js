import { Markup } from 'telegraf';

export function searchResultButtons(items) {
  return Markup.inlineKeyboard(
    items.slice(0, 8).map((item, index) => [
      Markup.button.callback(
        `${index + 1}. 💊 Посмотреть наличие`,
        `prod:${item.productId}`
      ),
    ])
  );
}

export function productCardButtons(productId, { isFavorite = false } = {}) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📍 Где купить', `stores:${productId}`),
      Markup.button.callback('💰 Сравнить цены', `prices:${productId}`),
    ],
    [
      Markup.button.callback(isFavorite ? '⭐ В избранном' : '⭐ В избранное', `fav:${productId}`),
      Markup.button.callback('📋 Описание', `desc:${productId}`),
    ],
    [Markup.button.callback('⬅️ Назад к результатам', 'back:search')],
  ]);
}

/**
 * Кнопки действий по аптекам (до 5 шт. — лимит удобства в Telegram).
 */
export function storeActionButtons(matches = []) {
  const rows = matches.slice(0, 5).flatMap((m, i) => {
    const n = i + 1;
    const actions = [];
    if (m.address) {
      const q = encodeURIComponent(m.address);
      actions.push(Markup.button.url(`${n} 🗺`, `https://maps.google.com/?q=${q}`));
    }
    if (m.phone) {
      const tel = String(m.phone).replace(/[^\d+]/g, '');
      if (tel) actions.push(Markup.button.url(`${n} 📞`, `tel:${tel}`));
    }
    actions.push(Markup.button.callback(`${n} 📦 Забронировать`, `book:${m.storeId || 0}`));
    return [actions];
  });
  rows.push([Markup.button.callback('🏠 Главное меню', 'nav:home')]);
  return Markup.inlineKeyboard(rows);
}

export function supportCategoryButtons() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔍 Не нашёл лекарство', 'sup:not_found')],
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
    [Markup.button.callback('📋 Статус обращения', `tstat:${ticketId}`)],
    [Markup.button.callback('➕ Дополнить обращение', `tadd:${ticketId}`)],
    [Markup.button.callback('❌ Закрыть обращение', `tclose:${ticketId}`)],
    [Markup.button.callback('🏠 Главное меню', 'nav:home')],
  ]);
}

export function favoritesButtons(favorites) {
  const rows = favorites.slice(0, 8).flatMap((fav) => [
    [Markup.button.callback(`🔍 ${shortName(fav.productName)}`, `prod:${fav.productId}`)],
    [
      Markup.button.callback(fav.watchPrice ? '🔔 Слежу' : '🔔 Следить за ценой', `watch:${fav.productId}`),
      Markup.button.callback('🗑 Удалить', `unfav:${fav.productId}`),
    ],
  ]);
  rows.push([Markup.button.callback('🏠 Главное меню', 'nav:home')]);
  return Markup.inlineKeyboard(rows);
}

export function historyButtons(history) {
  const rows = history.slice(0, 10).map((h, i) => [
    Markup.button.callback(`🔁 ${h.query}`.slice(0, 60), `hist:${i}`),
  ]);
  rows.push([
    Markup.button.callback('🗑 Очистить историю', 'hist:clear'),
    Markup.button.callback('🏠 Главное меню', 'nav:home'),
  ]);
  return Markup.inlineKeyboard(rows);
}

export function nearbyListButtons() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🗺 Показать адреса', 'near:list')],
    [Markup.button.callback('🏠 Главное меню', 'nav:home')],
  ]);
}

function shortName(name) {
  const s = String(name || 'Товар');
  return s.length > 28 ? `${s.slice(0, 27)}…` : s;
}
