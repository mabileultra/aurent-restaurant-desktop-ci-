import { describe, expect, it } from 'vitest';
import { buildReminderText, normalizePhone, telegramLink } from './billingReminder';

describe('billingReminder', () => {
  it('normalizes Uzbek numbers with or without country code', () => {
    expect(normalizePhone('+998 (90) 123-45-67')).toBe('998901234567');
    expect(normalizePhone('90 123 45 67')).toBe('998901234567');
    expect(normalizePhone('')).toBe('');
  });

  it('builds t.me phone link only when phone exists', () => {
    expect(telegramLink('+998901234567')).toBe('https://t.me/+998901234567');
    expect(telegramLink(null)).toBe('');
  });

  it('mentions debt only for negative balance', () => {
    const t = (key) => key.split('.').pop();
    const ctx = { t, money: String, formatDate: () => '16.10.2026' };
    const row = (balance, daysOverdue) => ({
      daysOverdue,
      billing: { companyId: 1, companyName: 'Co', balance, monthlyTotal: 100, nextChargeAt: '2026-10-16' },
    });
    expect(buildReminderText(row(-100, 3), ctx).split('\n')).toEqual(['greeting', 'debt', 'overdueSince', 'footer']);
    expect(buildReminderText(row(0, 0), ctx).split('\n')).toEqual(['greeting', 'dueOn', 'footer']);
  });
});
