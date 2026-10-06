export const STATE_TONE = {
  ACTIVE: 'success',
  DUE_SOON: 'warning',
  OVERDUE: 'danger',
  SUSPENDED: 'neutral',
  NOT_BILLED: 'info',
};

export function initials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '—';
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/** Подпись под датой списания: дни берём с backend, здесь только текст. */
export function dueHint(row, t) {
  const k = (key, opts) => t(`platform.billing.collections.${key}`, opts);
  if (row.daysOverdue > 0) return { text: k('overdueDays', { count: row.daysOverdue }), tone: 'danger' };
  if (row.daysUntilDue == null) return null;
  if (row.daysUntilDue === 0) return { text: k('dueToday'), tone: 'warning' };
  if (row.daysUntilDue === 1) return { text: k('dueTomorrow'), tone: 'warning' };
  if (row.daysUntilDue > 0) {
    return {
      text: k('dueInDays', { count: row.daysUntilDue }),
      tone: row.paymentState === 'DUE_SOON' ? 'warning' : 'muted',
    };
  }
  return null;
}

/** deferredUntil — начало следующего дня; возвращает последний день отсрочки или null, если истекла. */
export function activeDeferralDay(billing) {
  if (!billing?.deferredUntil) return null;
  const end = new Date(billing.deferredUntil);
  if (end <= new Date()) return null;
  return new Date(end.getTime() - 1);
}

export function balanceTone(balance) {
  const n = Number(balance || 0);
  if (n < 0) return 'danger';
  if (n > 0) return 'success';
  return 'muted';
}
