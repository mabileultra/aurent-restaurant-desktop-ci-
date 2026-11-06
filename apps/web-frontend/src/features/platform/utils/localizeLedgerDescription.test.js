import { describe, expect, it } from 'vitest';
import { localizeLedgerDescription } from './localizeLedgerDescription';

describe('localizeLedgerDescription', () => {
  const mockT = (key, opts) => {
    if (opts?.defaultValue) {
      let res = opts.defaultValue;
      if (opts.plan) res = res.replace('{{plan}}', opts.plan);
      if (opts.method) res = res.replace('{{method}}', opts.method);
      return res;
    }
    return key;
  };

  it('translates super-admin manual top-up to Uzbek default', () => {
    const res = localizeLedgerDescription('Ручное пополнение супер-админом', mockT);
    expect(res).toBe('Super-admin tomonidan hisob to‘ldirish');
  });

  it('translates super-admin manual debit / adjustment to Uzbek default', () => {
    const res = localizeLedgerDescription('Корректировка / списание супер-админом', mockT);
    expect(res).toBe('Super-admin tomonidan tuzatish / mablag‘ yechish');
  });

  it('translates monthly charge with plan name to Uzbek default', () => {
    const res = localizeLedgerDescription('Ежемесячное списание: Aurent Start', mockT);
    expect(res).toBe('Oylik to‘lov: Aurent Start');
  });

  it('translates monthly charge with default plan fallback', () => {
    const res = localizeLedgerDescription('Ежемесячное списание: тариф', mockT);
    expect(res).toBe('Oylik to‘lov: tarif');
  });

  it('translates payment method top-up description', () => {
    const res = localizeLedgerDescription('Пополнение через Click', mockT);
    expect(res).toBe('Click orqali to‘ldirish');
  });

  it('returns custom or unmatched descriptions unchanged', () => {
    expect(localizeLedgerDescription('Custom note 123', mockT)).toBe('Custom note 123');
    expect(localizeLedgerDescription('', mockT)).toBe('');
    expect(localizeLedgerDescription(null, mockT)).toBe(null);
  });
});
