import { describe, expect, it } from 'vitest';
import { BOLD_LINE_PREFIX, EMPH_LINE_PREFIX } from '../../../../src/restaurant/pos/utils/ticketLayout';
import { factoryPrintProfile } from '../../../../src/restaurant/shared/printProfile/printProfileDefaults';
import {
  styleSlipFieldLine,
  styleSlipItemRows,
  styleSlipTotalsRow,
} from '../../../../src/restaurant/pos/utils/styleSlipBodyLines';

describe('styleSlipBodyLines', () => {
  it('applies bold/size on slip meta and items', () => {
    const profile = factoryPrintProfile();
    profile.slips.SHIFT_ITEMS.fields.waiter.bold = true;
    profile.slips.SHIFT_ITEMS.fields.items.bold = true;
    profile.slips.SHIFT_ITEMS.fields.items.size = 'lg';
    profile.slips.SHIFT_ITEMS.fields.totals.bold = true;

    expect(styleSlipFieldLine('Dilnoza', profile, 'SHIFT_ITEMS', 'waiter')).toBe(`${BOLD_LINE_PREFIX}Dilnoza`);
    expect(styleSlipItemRows(['12 x Лагман'], profile, 'SHIFT_ITEMS')[0]).toBe(`${EMPH_LINE_PREFIX}12 x Лагман`);
    expect(styleSlipTotalsRow('ИТОГО 10', profile, 'SHIFT_ITEMS')).toBe(`${BOLD_LINE_PREFIX}ИТОГО 10`);
  });

  it('returns null when field is off', () => {
    const profile = factoryPrintProfile();
    profile.slips.SHIFT_ITEMS.fields.time.on = false;
    expect(styleSlipFieldLine('12:00', profile, 'SHIFT_ITEMS', 'time')).toBeNull();
  });
});
