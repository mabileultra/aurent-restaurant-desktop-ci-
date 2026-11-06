import { describe, expect, it } from 'vitest';
import {
  cleanPhone,
  buildTelLink,
  buildTelegramLink,
  buildMailtoLink,
  formatLeadDateTime,
  formatLeadRelativeTime,
  formatPreferredTime,
  formatLeadSource,
  formatLeadType,
  formatLeadStatus,
  guessBusinessTypeFromMessage,
} from './leadFormatUtils';

describe('leadFormatUtils', () => {
  it('cleans phone numbers and builds links', () => {
    expect(cleanPhone('+998 (90) 123-45-67')).toBe('+998901234567');
    expect(buildTelLink('+998 90 123 45 67')).toBe('tel:+998901234567');
    expect(buildTelegramLink('+998 90 123 45 67')).toBe('https://t.me/+998901234567');
    expect(buildMailtoLink('test@example.uz')).toBe('mailto:test@example.uz');
  });

  it('formats date and relative time accurately', () => {
    const fixedNow = new Date('2026-10-27T16:15:00.000Z');
    const earlier2Hours = new Date('2026-10-27T14:15:00.000Z');
    const earlier3Days = new Date('2026-10-24T16:15:00.000Z');

    expect(formatLeadRelativeTime(earlier2Hours.toISOString(), fixedNow)).toBe('2 soat');
    expect(formatLeadRelativeTime(earlier3Days.toISOString(), fixedNow)).toBe('3 kun');
    expect(formatLeadDateTime(fixedNow.toISOString())).toContain('oktabr');
  });

  it('formats preferred time correctly for raw digit strings and time ranges without guessing non-4-digit strings', () => {
    expect(formatPreferredTime(null)).toBe('—');
    expect(formatPreferredTime('')).toBe('—');
    expect(formatPreferredTime('1200')).toBe('12:00');
    expect(formatPreferredTime('0930')).toBe('09:30');
    expect(formatPreferredTime('14:30')).toBe('14:30');
    expect(formatPreferredTime('10:00 - 12:00')).toBe('10:00 – 12:00');

    // Ambiguous non-4-digit values remain raw and untouched
    expect(formatPreferredTime('111')).toBe('111');
    expect(formatPreferredTime('900')).toBe('900');
    expect(formatPreferredTime('ertalab')).toBe('ertalab');
  });

  it('formats lead sources, types, and statuses in readable Uzbek', () => {
    expect(formatLeadSource('contacts')).toBe('Bog\'lanish sahifasi');
    expect(formatLeadSource('footer')).toBe('Pastki qism (footer)');
    expect(formatLeadSource(null)).toBe('Sayt');

    expect(formatLeadType('CONNECT')).toBe('Ulanish');
    expect(formatLeadType('DEMO')).toBe('Demo');
    expect(formatLeadType('QUESTION')).toBe('Savol');

    expect(formatLeadStatus('NEW')).toBe('Yangi');
    expect(formatLeadStatus('IN_PROGRESS')).toBe('Jarayonda');
    expect(formatLeadStatus('DONE')).toBe('Yakunlangan');
  });

  it('guesses business type from message context including CONSTRUCTION', () => {
    expect(guessBusinessTypeFromMessage('Oziq-ovqat do\'koni ochyapmiz')).toBe('GROCERY');
    expect(guessBusinessTypeFromMessage('Restoran ochyapmiz, 12 ta stol')).toBe('RESTAURANT');
    expect(guessBusinessTypeFromMessage('Kiyim do\'koni uchun demo kerak')).toBe('CLOTHING');
    expect(guessBusinessTypeFromMessage('Dorixona uchun skaner kerak')).toBe('PHARMACY');
    expect(guessBusinessTypeFromMessage('Oshxona / bufet uchun')).toBe('CANTEEN');
    expect(guessBusinessTypeFromMessage('Qurilish mollari do\'koni')).toBe('CONSTRUCTION');
    expect(guessBusinessTypeFromMessage('Umumiy savol bor')).toBeNull();
    expect(guessBusinessTypeFromMessage('')).toBeNull();
    expect(guessBusinessTypeFromMessage(null)).toBeNull();
  });
});
