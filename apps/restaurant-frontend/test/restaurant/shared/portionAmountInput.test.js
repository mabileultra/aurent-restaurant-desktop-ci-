import { describe, expect, it } from 'vitest';
import {
  formatPortionAmountDisplay,
  parsePortionAmountInput,
  sanitizePortionAmountTyping,
} from '../../../src/restaurant/shared/utils/portionAmountInput';
import {
  formatMenuPortion,
  formatVariantPortionLabel,
} from '../../../src/restaurant/shared/utils/formatMenuPortion';

describe('portionAmountInput', () => {
  it('formats clean numbers without scale noise', () => {
    expect(formatPortionAmountDisplay('1.000')).toBe('1');
    expect(formatPortionAmountDisplay(1.5)).toBe('1.5');
    expect(formatPortionAmountDisplay('0.700')).toBe('0.7');
    expect(formatPortionAmountDisplay('1.001')).toBe('1.001');
  });

  it('parses 1, half, comma and custom values', () => {
    expect(parsePortionAmountInput('1')).toBe(1);
    expect(parsePortionAmountInput('1.5')).toBe(1.5);
    expect(parsePortionAmountInput('1,5')).toBe(1.5);
    expect(parsePortionAmountInput('полтора')).toBe(1.5);
    expect(parsePortionAmountInput('0.7')).toBe(0.7);
    expect(parsePortionAmountInput('')).toBeNull();
    expect(parsePortionAmountInput('abc')).toBeNull();
  });

  it('keeps decimal typing sane', () => {
    expect(sanitizePortionAmountTyping('1,5')).toBe('1.5');
    expect(sanitizePortionAmountTyping('12.3.4')).toBe('12.34');
  });
});

describe('formatMenuPortion', () => {
  it('shows 1 / полтора / custom without trailing zeros', () => {
    expect(formatMenuPortion({ portionAmount: 1, portionUnit: 'PORTION' })).toBe('1 порция');
    expect(formatMenuPortion({ portionAmount: '1.500', portionUnit: 'PORTION' })).toBe('полтора порции');
    expect(formatMenuPortion({ portionAmount: '0.700', portionUnit: 'PORTION' })).toBe('0.7 порции');
  });

  it('falls back to relative size labels when amount missing', () => {
    const t = (key) => key;
    expect(formatVariantPortionLabel({}, { index: 0, count: 3, t })).toBe('rst.order.portionSizeSmall');
    expect(formatVariantPortionLabel({}, { index: 1, count: 3, t })).toBe('rst.order.portionSizeMedium');
    expect(formatVariantPortionLabel({}, { index: 2, count: 3, t })).toBe('rst.order.portionSizeLarge');
  });
});
