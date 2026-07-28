import { escapeHtml } from '../utils/telegramText.js';

export function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} сум`;
}

export function formatStock(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n <= 0) return 'нет в наличии';
  return `${n} шт.`;
}

export function minPriceOf(item) {
  const prices = (item.matches || [])
    .map((m) => Number(m.price))
    .filter((n) => Number.isFinite(n));
  if (!prices.length) return null;
  return Math.min(...prices);
}

export function welcomeText(firstName) {
  const name = escapeHtml(firstName || 'друг');
  return [
    `Здравствуйте, ${name}! 👋`,
    '',
    'Добро пожаловать в <b>Aurent</b> 💊',
    '',
    'Здесь можно найти лекарство, сравнить цены и узнать наличие в аптеках.',
    '',
    'Выберите действие:',
  ].join('\n');
}

export function searchPromptText() {
  return [
    'Введите название лекарства или штрихкод.',
    '',
    'Например:',
    '• Парацетамол',
    '• Ибупрофен',
    '• 4780012345678',
  ].join('\n');
}

export function formatSearchResults(data) {
  const query = escapeHtml(data?.query || '');
  const items = Array.isArray(data?.items) ? data.items : [];
  if (!items.length) {
    return `🔍 По запросу «<b>${query}</b>» ничего не найдено.\n\nПопробуйте другое название.`;
  }

  const lines = [`Найдено <b>${items.length}</b> вариант(ов) по запросу «<b>${query}</b>»:`, ''];
  items.forEach((item, index) => {
    const min = minPriceOf(item);
    lines.push(`<b>${index + 1}. ${escapeHtml(item.productName)}</b>`);
    lines.push(min != null ? `от <b>${escapeHtml(formatPrice(min))}</b>` : 'цена уточняется');
    lines.push('');
  });
  return lines.join('\n').trim();
}

export function formatProductCard(item) {
  const attrs = firstAttrs(item);
  const min = minPriceOf(item);
  const pharmacies = (item.matches || []).filter((m) => Number(m.stockQuantity) > 0).length
    || (item.matches || []).length;

  const lines = [
    `💊 <b>${escapeHtml(item.productName || 'Лекарство')}</b>`,
    '',
  ];
  if (attrs.manufacturer) lines.push(`Производитель: ${escapeHtml(attrs.manufacturer)}`);
  if (attrs.form) lines.push(`Форма: ${escapeHtml(attrs.form)}`);
  if (attrs.dose) lines.push(`Дозировка: ${escapeHtml(attrs.dose)}`);
  if (item.barcode) lines.push(`Штрихкод: <code>${escapeHtml(item.barcode)}</code>`);
  if (item.ikpu) lines.push(`ИКПУ: <code>${escapeHtml(item.ikpu)}</code>`);
  lines.push(`Минимальная цена: <b>${escapeHtml(formatPrice(min))}</b>`);
  lines.push(`Найдено в <b>${pharmacies}</b> аптеках`);
  return lines.join('\n');
}

export function formatStoreAvailability(item) {
  const lines = [
    `Аптеки, где есть <b>${escapeHtml(item.productName)}</b>:`,
    '',
  ];
  const matches = [...(item.matches || [])].sort((a, b) => Number(a.price) - Number(b.price));
  matches.slice(0, 10).forEach((m, i) => {
    lines.push(`<b>${i + 1}. ${escapeHtml(m.storeName || 'Аптека')}</b>`);
    lines.push(`💰 ${escapeHtml(formatPrice(m.price))}`);
    lines.push(`📦 В наличии: ${escapeHtml(formatStock(m.stockQuantity))}`);
    if (m.address) lines.push(`📍 ${escapeHtml(m.address)}`);
    if (m.phone) lines.push(`📞 ${escapeHtml(m.phone)}`);
    lines.push('🕘 Часы работы уточняйте по телефону');
    lines.push('');
  });
  return lines.join('\n').trim();
}

export function formatPriceCompare(item) {
  const lines = [`💰 Сравнение цен: <b>${escapeHtml(item.productName)}</b>`, ''];
  const matches = [...(item.matches || [])].sort((a, b) => Number(a.price) - Number(b.price));
  matches.forEach((m, i) => {
    lines.push(`${i + 1}. ${escapeHtml(m.storeName)} — <b>${escapeHtml(formatPrice(m.price))}</b>`);
  });
  return lines.join('\n');
}

export function formatDescription(item) {
  const attrs = firstAttrs(item);
  const lines = [
    `📋 <b>${escapeHtml(item.productName)}</b>`,
    '',
  ];
  if (item.barcode) lines.push(`Штрихкод: ${escapeHtml(item.barcode)}`);
  if (item.ikpu) lines.push(`ИКПУ: ${escapeHtml(item.ikpu)}`);
  for (const [k, v] of Object.entries(attrs.rest || {})) {
    lines.push(`${escapeHtml(k)}: ${escapeHtml(v)}`);
  }
  if (lines.length === 2) {
    lines.push('Подробное описание пока не заполнено в каталоге.');
  }
  return lines.join('\n');
}

export function formatStoresNearby(stores) {
  if (!stores.length) {
    return 'Пока нет активных аптек в каталоге.';
  }
  const lines = [
    'Ближайшие аптеки Aurent:',
    '',
    '⚠️ Расстояние появится после добавления координат магазинов. Сейчас — список аптек с адресами:',
    '',
  ];
  stores.slice(0, 15).forEach((s, i) => {
    lines.push(`<b>${i + 1}. ${escapeHtml(s.storeName)}</b>`);
    if (s.address) lines.push(`📍 ${escapeHtml(s.address)}`);
    if (s.phone) lines.push(`📞 ${escapeHtml(s.phone)}`);
    lines.push('');
  });
  return lines.join('\n').trim();
}

export function formatFavorites(favorites) {
  if (!favorites.length) {
    return '⭐ Избранное пусто.\nДобавьте лекарства из карточки товара.';
  }
  const lines = ['⭐ <b>Избранное</b>', ''];
  favorites.forEach((f, i) => {
    lines.push(`<b>${i + 1}. ${escapeHtml(f.productName)}</b>`);
    lines.push(
      f.minPrice != null
        ? `Минимальная цена: ${escapeHtml(formatPrice(f.minPrice))}`
        : 'Цена уточняется'
    );
    if (f.watchPrice) lines.push('🔔 Слежение за ценой включено');
    lines.push('');
  });
  return lines.join('\n').trim();
}

export function formatHistory(history) {
  if (!history.length) {
    return '🕘 История поиска пуста.';
  }
  const groups = groupByDay(history);
  const lines = ['🕘 <b>История поиска</b>', ''];
  for (const [label, items] of groups) {
    lines.push(`<b>${label}</b>`);
    items.forEach((h) => lines.push(`• ${escapeHtml(h.query)}`));
    lines.push('');
  }
  return lines.join('\n').trim();
}

function firstAttrs(item) {
  const raw = item?.matches?.[0]?.attributes || {};
  const manufacturer = raw.manufacturer || raw.brand || raw.producer || '';
  const form = raw.form || raw.dosage_form || raw.package || '';
  const dose = raw.dose || raw.dosage || raw.strength || '';
  const rest = { ...raw };
  delete rest.manufacturer;
  delete rest.brand;
  delete rest.producer;
  delete rest.form;
  delete rest.dosage_form;
  delete rest.package;
  delete rest.dose;
  delete rest.dosage;
  delete rest.strength;
  return { manufacturer, form, dose, rest };
}

function groupByDay(history) {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const map = new Map();
  for (const h of history) {
    const key = dayKey(new Date(h.at));
    let label = key;
    if (key === today) label = 'Сегодня';
    else if (key === yesterday) label = 'Вчера';
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(h);
  }
  return map;
}

function dayKey(d) {
  return d.toISOString().slice(0, 10);
}
