import { escapeHtml } from '../utils/telegramText.js';

export function welcomeText(firstName) {
  const name = escapeHtml(firstName || 'друг');
  return [
    `Здравствуйте, ${name}! 👋`,
    '',
    'Вы в <b>главном меню</b> Aurent.',
    'Здесь можно найти лекарство, проверить наличие и цены в аптеках.',
    '',
    'Выберите действие ниже 👇',
  ].join('\n');
}

export function searchPromptText() {
  return [
    '🔎 <b>Поиск лекарства</b>',
    '',
    'Введите название препарата.',
    '',
    'Например:',
    '• Парацетамол',
    '• Нурофен',
    '• Амоксициллин',
    '• Ибупрофен',
  ].join('\n');
}

export function formatSearchResults(data) {
  const query = escapeHtml(data?.query || '');
  const items = Array.isArray(data?.items) ? data.items : [];
  if (!items.length) return null;
  const lines = [
    `🔎 По запросу «<b>${query}</b>» найдено: <b>${items.length}</b>`,
    '',
    'Выберите препарат:',
  ];
  items.slice(0, 10).forEach((item, i) => {
    lines.push(`${i + 1}. 💊 ${escapeHtml(item.productName)}`);
  });
  return lines.join('\n');
}

export function notFoundText(query) {
  return [
    '😔 К сожалению, препарат не найден.',
    '',
    query ? `Запрос: «<b>${escapeHtml(query)}</b>»` : null,
    '',
    'Попробуйте:',
    '• проверить написание;',
    '• другое название;',
    '• поиск по штрихкоду.',
  ].filter(Boolean).join('\n');
}

export function formatProductCard(item) {
  const attrs = firstAttrs(item);
  const min = minPriceOf(item);
  const lines = [
    `💊 <b>${escapeHtml(item.productName || 'Лекарство')}</b>`,
    '',
  ];
  if (attrs.form || attrs.forma) {
    lines.push(`Форма: ${escapeHtml(attrs.form || attrs.forma)}`);
  }
  if (attrs.dose || attrs.dosage || attrs.doza) {
    lines.push(`Дозировка: ${escapeHtml(attrs.dose || attrs.dosage || attrs.doza)}`);
  }
  if (item.barcode) lines.push(`Штрихкод: <code>${escapeHtml(item.barcode)}</code>`);
  if (min != null) lines.push(`Минимальная цена: <b>${formatPrice(min)}</b>`);
  const pharmacies = (item.matches || []).filter((m) => Number(m.stockQuantity) > 0).length;
  if (pharmacies) lines.push(`В наличии в аптеках: <b>${pharmacies}</b>`);
  lines.push('', 'Что вы хотите сделать?');
  return lines.join('\n');
}

export function formatPharmacyResults(item, matches) {
  const lines = [
    `💊 <b>${escapeHtml(item.productName || 'Лекарство')}</b>`,
    '',
    `Найдено аптек: <b>${matches.length}</b>`,
    '',
  ];
  matches.slice(0, 10).forEach((m, i) => {
    lines.push(`<b>${i + 1}. 🏪 ${escapeHtml(m.storeName || 'Аптека')}</b>`);
    if (m._distanceLabel) lines.push(`📍 ${escapeHtml(m._distanceLabel)}`);
    if (m.price != null) lines.push(`💰 ${formatPrice(m.price)}`);
    lines.push(stockLabel(m.stockQuantity));
    lines.push('');
  });
  if (!matches.some((m) => m._distanceLabel)) {
    lines.push('⚠️ Расстояние появится, когда у аптек будут координаты в системе.');
  }
  return lines.join('\n').trim();
}

export function formatPharmacyCard(item, store) {
  const lines = [
    `🏪 <b>${escapeHtml(store.storeName || 'Аптека')}</b>`,
    '',
  ];
  if (store.address) {
    lines.push('📍 Адрес:');
    lines.push(escapeHtml(store.address));
    lines.push('');
  }
  if (store._distanceLabel) lines.push(`📏 Расстояние: ${escapeHtml(store._distanceLabel)}`);
  lines.push(`💊 ${escapeHtml(item.productName || '')}`);
  if (store.price != null) lines.push(`💰 ${formatPrice(store.price)}`);
  lines.push(stockLabel(store.stockQuantity));
  if (store.phone) lines.push(`📞 ${escapeHtml(store.phone)}`);
  return lines.join('\n');
}

export function nearbyPromptText() {
  return [
    '📍 <b>Аптеки рядом</b>',
    '',
    'Отправьте своё местоположение,',
    'чтобы мы нашли ближайшие аптеки.',
  ].join('\n');
}

export function formatNearbyList(stores) {
  const lines = [
    '📍 Ваше местоположение получено.',
    '',
    `Найдено аптек: <b>${stores.length}</b>`,
    '',
  ];
  stores.slice(0, 12).forEach((s, i) => {
    lines.push(`<b>${i + 1}. 🏪 ${escapeHtml(s.storeName)}</b>`);
    if (s._distanceLabel) lines.push(`📍 ${escapeHtml(s._distanceLabel)}`);
    else if (s.address) lines.push(`📍 ${escapeHtml(s.address)}`);
    lines.push('');
  });
  if (!stores.some((s) => s._distanceLabel)) {
    lines.push('⚠️ Расстояние появится после добавления координат аптек.');
  }
  return lines.join('\n').trim();
}

export function formatNearbyStoreCard(store) {
  const lines = [`🏪 <b>${escapeHtml(store.storeName || 'Аптека')}</b>`, ''];
  if (store.address) {
    lines.push('📍 Адрес:');
    lines.push(escapeHtml(store.address));
  }
  if (store._distanceLabel) lines.push(`📏 ${escapeHtml(store._distanceLabel)}`);
  if (store.phone) lines.push(`📞 ${escapeHtml(store.phone)}`);
  return lines.join('\n');
}

export function favoritesEmptyText() {
  return [
    '⭐ Избранное пока пусто.',
    '',
    'Добавляйте препараты в избранное,',
    'чтобы быстро находить их снова.',
  ].join('\n');
}

export function favoritesListText(favorites) {
  const lines = ['⭐ <b>Избранные препараты</b>', ''];
  favorites.forEach((f, i) => {
    lines.push(`${i + 1}. 💊 ${escapeHtml(f.productName)}`);
  });
  lines.push('', 'Выберите препарат:');
  return lines.join('\n');
}

export function historyEmptyText() {
  return '🕘 История поиска пока пуста.\nНайдите лекарство — запрос появится здесь.';
}

export function historyListText(history) {
  const lines = ['🕘 <b>История поиска</b>', ''];
  history.slice(0, 20).forEach((h, i) => {
    const when = h.at ? formatWhen(h.at) : '';
    lines.push(`${i + 1}. ${escapeHtml(h.query)}${when ? ` <i>(${escapeHtml(when)})</i>` : ''}`);
  });
  lines.push('', 'Нажмите запрос, чтобы искать снова.');
  return lines.join('\n');
}

export function barcodePromptText() {
  return [
    '📷 <b>Сканирование препарата</b>',
    '',
    'Отправьте <b>цифры штрихкода</b> текстом',
    'или фотографию штрихкода.',
    '',
    'Фото:',
    '• чёткое;',
    '• без бликов;',
    '• штрихкод целиком в кадре.',
  ].join('\n');
}

export function barcodeFailText() {
  return [
    '❌ Не удалось распознать штрихкод.',
    '',
    'Попробуйте:',
    '• отправить цифры штрихкода текстом;',
    '• сделать фото ближе;',
    '• убрать блики.',
  ].join('\n');
}

export function supportMenuText() {
  return [
    '🆘 <b>Служба поддержки</b>',
    '',
    'С чем возникла проблема?',
  ].join('\n');
}

export function supportAskMessageText(label) {
  return [
    `Категория: <b>${escapeHtml(label)}</b>`,
    '',
    'Опишите проблему одним сообщением.',
    'Можно отправить текст, фото или документ.',
  ].join('\n');
}

export function aboutText() {
  return [
    'ℹ️ <b>О сервисе</b>',
    '',
    'Aurent помогает быстро найти',
    'лекарственные препараты и аптеки рядом.',
    '',
    'Вы можете:',
    '• искать лекарства;',
    '• проверять наличие;',
    '• сравнивать цены;',
    '• находить ближайшие аптеки;',
    '• сохранять препараты в избранное.',
    '',
    'Информация предоставляется аптеками',
    'и может изменяться.',
    '',
    'Версия: 1.1.0',
  ].join('\n');
}

export function needLocationText() {
  return [
    '📍 Сейчас необходимо отправить местоположение.',
    '',
    'Используйте кнопку:',
    '«📍 Отправить моё местоположение»',
  ].join('\n');
}

export function needMedicineNameText() {
  return '🔎 Пожалуйста, введите название лекарства.';
}

export function genericErrorText() {
  return [
    '⚠️ Произошла ошибка.',
    '',
    'Попробуйте повторить действие.',
  ].join('\n');
}

export function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} сум`;
}

export function minPriceOf(item) {
  const prices = (item.matches || [])
    .map((m) => Number(m.price))
    .filter((n) => Number.isFinite(n));
  if (!prices.length) return null;
  return Math.min(...prices);
}

function stockLabel(qty) {
  const n = Number(qty);
  if (!Number.isFinite(n) || n <= 0) return '🔴 Нет в наличии';
  if (n <= 3) return '🟡 Осталось мало';
  return '🟢 В наличии';
}

function firstAttrs(item) {
  const match = (item.matches || []).find((m) => m.attributes && Object.keys(m.attributes).length);
  return match?.attributes || {};
}

function formatWhen(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
