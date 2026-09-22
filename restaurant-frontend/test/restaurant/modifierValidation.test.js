import { describe, expect, it } from 'vitest';
import {
  canToggleModifierOption,
  validateModifierSelection,
} from '../../src/restaurant/pos/utils/modifierValidation';

const groups = [
  {
    id: 1,
    name: 'Size',
    minSelect: 1,
    maxSelect: 1,
    options: [{ id: 10, name: 'S' }, { id: 11, name: 'L' }],
  },
  {
    id: 2,
    name: 'Extras',
    minSelect: 0,
    maxSelect: 2,
    options: [{ id: 20, name: 'Cheese' }, { id: 21, name: 'Bacon' }, { id: 22, name: 'Egg' }],
  },
];

describe('modifierValidation', () => {
  it('requires min selection', () => {
    const result = validateModifierSelection(groups, []);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('min');
  });

  it('accepts valid selection', () => {
    expect(validateModifierSelection(groups, [10, 20]).ok).toBe(true);
  });

  it('blocks over max', () => {
    const result = validateModifierSelection(groups, [10, 20, 21, 22]);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('max');
  });

  it('prevents toggling beyond max', () => {
    expect(canToggleModifierOption(groups[1], 22, [20, 21])).toBe(false);
    expect(canToggleModifierOption(groups[1], 20, [20, 21])).toBe(true);
  });
});
