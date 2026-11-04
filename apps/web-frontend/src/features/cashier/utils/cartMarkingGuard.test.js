import { describe, expect, it } from 'vitest';
import { cartHasUnmarkedMarkedLines, cartLineNeedsMarking } from './cartMarkingGuard';

describe('cartMarkingGuard', () => {
  it('строка с markedProduct без КМ — needs marking (утилита; на обычной кассе оплату не блокируем)', () => {
    expect(cartLineNeedsMarking({ markedProduct: true })).toBe(true);
    expect(cartLineNeedsMarking({ markedProduct: true, productMark: '01…' })).toBe(false);
    expect(cartLineNeedsMarking({ markedProduct: true, productMarks: ['01…'] })).toBe(false);
    expect(cartLineNeedsMarking({ markedProduct: false })).toBe(false);
  });

  it('есть ли в чеке строки без КМ', () => {
    expect(
      cartHasUnmarkedMarkedLines([
        { markedProduct: true },
        { markedProduct: true, productMarks: ['x'] },
      ])
    ).toBe(true);
    expect(
      cartHasUnmarkedMarkedLines([{ markedProduct: true, productMark: 'x' }])
    ).toBe(false);
    expect(cartHasUnmarkedMarkedLines([{ markedProduct: false }])).toBe(false);
  });
});
