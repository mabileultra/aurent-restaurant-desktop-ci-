import { describe, it, expect } from 'vitest';
import {
  resolveCurrentAuthor,
  getLeadWaitUrgency,
  parseLeadTimeline,
  appendLeadTimelineEvent,
  MAX_TIMELINE_LENGTH,
} from './leadTimelineUtils';

describe('leadTimelineUtils', () => {
  it('resolves current author correctly', () => {
    expect(resolveCurrentAuthor(null)).toBe('Administrator');
    expect(resolveCurrentAuthor({ firstName: 'Ali', lastName: 'Valiyev' })).toBe('Ali Valiyev');
    expect(resolveCurrentAuthor({ username: 'superadmin' })).toBe('superadmin');
  });

  it('calculates wait urgency based on SLA', () => {
    const now = new Date('2026-11-03T12:00:00Z');
    const leadFresh = { status: 'NEW', createdAt: '2026-11-03T10:00:00Z' };
    expect(getLeadWaitUrgency(leadFresh, now).isUrgent).toBe(false);

    const lead1Day = { status: 'NEW', createdAt: '2026-11-02T10:00:00Z' };
    expect(getLeadWaitUrgency(lead1Day, now).isUrgent).toBe(true);
    expect(getLeadWaitUrgency(lead1Day, now).level).toBe('warning');

    const lead3Days = { status: 'NEW', createdAt: '2026-10-31T10:00:00Z' };
    expect(getLeadWaitUrgency(lead3Days, now).isUrgent).toBe(true);
    expect(getLeadWaitUrgency(lead3Days, now).level).toBe('danger');
  });

  it('parses lead timeline from JSON and legacy note', () => {
    const lead = { createdAt: '2026-11-01T10:00:00Z', source: 'contacts' };
    const emptyTimeline = parseLeadTimeline('', lead);
    expect(emptyTimeline).toHaveLength(1);
    expect(emptyTimeline[0].type).toBe('created');

    const legacyTimeline = parseLeadTimeline('Eski izoh matni', lead);
    expect(legacyTimeline).toHaveLength(2);
    expect(legacyTimeline[0].text).toBe('Eski izoh matni');
    expect(legacyTimeline[0].at).toBe('2026-11-01T10:00:00Z');
  });

  it('preserves leadCreatedAt for legacy note and trims exceeding length', () => {
    const leadCreatedAt = '2026-10-20T10:00:00Z';
    const note = appendLeadTimelineEvent('Old note', { author: 'Bobur', text: 'New note' }, { leadCreatedAt });
    const parsed = JSON.parse(note);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].author).toBe('Bobur');
    expect(parsed[1].at).toBe(leadCreatedAt);

    // Exceeding length test
    let giantNote = note;
    for (let i = 0; i < 50; i++) {
      giantNote = appendLeadTimelineEvent(
        giantNote,
        { author: 'Admin', text: 'Long comment test '.repeat(10) },
        { leadCreatedAt, maxLength: 800 }
      );
    }
    expect(giantNote.length).toBeLessThanOrEqual(800);
    const parsedGiant = JSON.parse(giantNote);
    expect(parsedGiant.length).toBeGreaterThan(0);
  });
});
