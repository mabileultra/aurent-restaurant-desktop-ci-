/** Телефон → цифры с кодом страны (по умолчанию Узбекистан, 998). */
export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 9) return `998${digits}`;
  return digits;
}

/** t.me/+номер открывает чат, если у владельца номера есть Telegram и поиск по номеру разрешён. */
export function telegramLink(phone) {
  const digits = normalizePhone(phone);
  return digits ? `https://t.me/+${digits}` : '';
}

export function buildReminderText(row, { t, money, formatDate }) {
  const b = row.billing;
  const k = (key, opts) => t(`platform.billing.collections.reminder.${key}`, opts);
  const currency = t('billing.currency');
  const balance = Number(b.balance || 0);
  const lines = [k('greeting', { name: b.companyName || `#${b.companyId}` })];
  if (balance < 0) {
    lines.push(k('debt', { amount: money(-balance), currency }));
  }
  if (b.nextChargeAt) {
    lines.push(k(row.daysOverdue > 0 ? 'overdueSince' : 'dueOn', {
      date: formatDate(b.nextChargeAt),
      amount: money(b.monthlyTotal),
      currency,
    }));
  }
  lines.push(k('footer'));
  return lines.join('\n');
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
