import { describe, it, expect } from 'vitest';
import { resolveReceiptShiftLabel } from './resolveReceiptShiftLabel';

describe('resolveReceiptShiftLabel', () => {
  it('does not invent shift from receipt number digits', () => {
    expect(
      resolveReceiptShiftLabel({ receiptNumber: 'PHR-20260917-0001' }),
    ).toBe('—');
    expect(
      resolveReceiptShiftLabel({ receiptNumber: 'PHR-20260917-0002' }),
    ).toBe('—');
  });

  it('uses shift open time when present', () => {
    expect(
      resolveReceiptShiftLabel({
        receiptNumber: 'PHR-20260917-0001',
        shiftOpenedAt: '2026-09-17T09:05:00+05:00',
      }),
    ).toMatch(/17\.09\.2026/);
  });

  it('prefers env only when no shift data', () => {
    expect(
      resolveReceiptShiftLabel(
        { receiptNumber: 'PHR-20260917-0001' },
        { envShiftNo: '12' },
      ),
    ).toBe('12');
  });
});
