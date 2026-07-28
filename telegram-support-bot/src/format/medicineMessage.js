import { escapeHtml } from '../utils/telegramText.js';

function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} сум`;
}

function formatStock(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n <= 0) return 'нет в наличии';
  return String(n);
}

function formatAttributes(attributes) {
  if (!attributes || typeof attributes !== 'object') return [];
  const preferred = ['expiry_date', 'expiryDate', 'batch', 'series', 'batch_number'];
  const lines = [];
  for (const key of preferred) {
    const value = attributes[key];
    if (value == null || !String(value).trim()) continue;
    const label = key.toLowerCase().includes('expir') ? 'Срок' : 'Серия';
    lines.push(`${label}: ${String(value).trim()}`);
  }
  return lines;
}

/**
 * Форматирует ответ поиска лекарств для Telegram (HTML).
 */
export function formatMedicineSearchMessage(data) {
  const query = escapeHtml(data?.query || '');
  const items = Array.isArray(data?.items) ? data.items : [];

  if (items.length === 0) {
    return [
      `🔍 По запросу <b>${query}</b> ничего не найдено.`,
      '',
      'Попробуйте другое название или штрихкод.',
    ].join('\n');
  }

  const parts = [
    `🔍 Найдено по запросу <b>${query}</b>: <b>${items.length}</b>`,
    '',
  ];

  for (const item of items) {
    parts.push(`💊 <b>${escapeHtml(item.productName || 'Без названия')}</b>`);
    if (item.barcode) {
      parts.push(`Штрихкод: <code>${escapeHtml(item.barcode)}</code>`);
    }
    if (item.ikpu) {
      parts.push(`ИКПУ: <code>${escapeHtml(item.ikpu)}</code>`);
    }

    const matches = Array.isArray(item.matches) ? item.matches : [];
    for (const match of matches) {
      parts.push('');
      parts.push(`🏪 <b>${escapeHtml(match.storeName || 'Магазин')}</b>`);
      parts.push(`Цена: <b>${escapeHtml(formatPrice(match.price))}</b>`);
      parts.push(`Остаток: ${escapeHtml(formatStock(match.stockQuantity))}`);
      if (match.address) {
        parts.push(`Адрес: ${escapeHtml(match.address)}`);
      }
      if (match.phone) {
        parts.push(`Телефон: ${escapeHtml(match.phone)}`);
      }
      for (const attrLine of formatAttributes(match.attributes)) {
        parts.push(escapeHtml(attrLine));
      }
    }
    parts.push('');
    parts.push('────────');
    parts.push('');
  }

  let text = parts.join('\n').trim();
  if (text.length > 3900) {
    text = `${text.slice(0, 3900)}\n\n…результат обрезан. Уточните запрос.`;
  }
  return text;
}
