import { describe, expect, it } from 'vitest';
import {
  formatRangeDisplayText,
  formatRangeFooterText,
} from './dateRangeLabelHelpers';

describe('dateRangeLabelHelpers', () => {
  it('formats display text with both dates', () => {
    const text = formatRangeDisplayText({
      from: '2026-05-01',
      to: '2026-05-10',
    });
    expect(text).toContain('01.05.2026 — 10.05.2026');
  });

  it('formats display text with fallback placeholder', () => {
    const text = formatRangeDisplayText({
      from: '',
      to: '',
      placeholder: 'Select range',
    });
    expect(text).toBe('Select range');
  });

  it('formats footer text with both dates', () => {
    const text = formatRangeFooterText({
      draftFrom: '2026-05-01',
      draftTo: '2026-05-05',
      lang: 'uz',
    });
    expect(text).toContain('01.05.2026 — 05.05.2026');
  });
});
