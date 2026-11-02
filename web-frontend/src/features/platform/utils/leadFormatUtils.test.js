import { describe, expect, it } from 'vitest';
import {
  cleanPhone,
  buildTelLink,
  buildTelegramLink,
  buildMailtoLink,
  formatLeadDateTime,
  formatLeadRelativeTime,
  getLeadWaitUrgency,
  parseLeadTimeline,
  appendLeadTimelineEvent,
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

  it('calculates wait urgency correctly for NEW leads', () => {
    const fixedNow = new Date('2026-10-27T16:00:00.000Z');

    // 3 days ago
    const lead3Days = {
      status: 'NEW',
      createdAt: new Date('2026-10-24T10:00:00.000Z').toISOString(),
    };
    const res3Days = getLeadWaitUrgency(lead3Days, fixedNow);
    expect(res3Days.isUrgent).toBe(true);
    expect(res3Days.level).toBe('danger');
    expect(res3Days.waitText).toBe('3 kundan beri javobsiz');

    // 1 day ago
    const lead1Day = {
      status: 'NEW',
      createdAt: new Date('2026-10-26T12:00:00.000Z').toISOString(),
    };
    const res1Day = getLeadWaitUrgency(lead1Day, fixedNow);
    expect(res1Day.isUrgent).toBe(true);
    expect(res1Day.level).toBe('warning');
    expect(res1Day.waitText).toBe('1 kundan beri javobsiz');

    // 2 hours ago
    const lead2Hours = {
      status: 'NEW',
      createdAt: new Date('2026-10-27T14:00:00.000Z').toISOString(),
    };
    const res2Hours = getLeadWaitUrgency(lead2Hours, fixedNow);
    expect(res2Hours.isUrgent).toBe(false);
    expect(res2Hours.level).toBe('info');
    expect(res2Hours.waitText).toBe('2 soatdan beri javobsiz');

    // Non-NEW lead
    const leadDone = {
      status: 'DONE',
      createdAt: new Date('2026-10-24T10:00:00.000Z').toISOString(),
    };
    expect(getLeadWaitUrgency(leadDone, fixedNow).isUrgent).toBe(false);
  });

  it('parses and appends timeline events properly', () => {
    const lead = {
      createdAt: '2026-10-27T16:15:00.000Z',
      source: 'Tariflar',
    };

    // Empty note -> only initial
    const initialOnly = parseLeadTimeline(null, lead);
    expect(initialOnly).toHaveLength(1);
    expect(initialOnly[0].type).toBe('created');
    expect(initialOnly[0].text).toContain('Tariflar');

    // Legacy plain text note
    const legacy = parseLeadTimeline('Demo kelishildi', lead);
    expect(legacy).toHaveLength(2);
    expect(legacy[0].text).toBe('Demo kelishildi');

    // Appending a new event
    const serialized = appendLeadTimelineEvent(null, {
      text: 'Telefon qilindi',
      author: 'Admin',
      at: '2026-10-27T17:00:00.000Z',
    });
    const parsed = parseLeadTimeline(serialized, lead);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].text).toBe('Telefon qilindi');
  });

  it('guesses business type from message context', () => {
    expect(guessBusinessTypeFromMessage('Oziq-ovqat do\'koni ochyapmiz')).toBe('GROCERY');
    expect(guessBusinessTypeFromMessage('Restoran ochyapmiz, 12 ta stol')).toBe('RESTAURANT');
    expect(guessBusinessTypeFromMessage('Kiyim do\'koni uchun demo kerak')).toBe('CLOTHING');
    expect(guessBusinessTypeFromMessage('Dorixona uchun skaner kerak')).toBe('PHARMACY');
    expect(guessBusinessTypeFromMessage('Oshxona / bufet uchun')).toBe('CANTEEN');
    expect(guessBusinessTypeFromMessage('Umumiy savol bor')).toBe('UNIVERSAL');
  });
});
