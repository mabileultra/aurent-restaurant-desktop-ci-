import { describe, it, expect } from 'vitest';
import { formatCashierShiftLabel } from './formatCashierShiftLabel';

describe('formatCashierShiftLabel', () => {
  it('prefers register number', () => {
    expect(
      formatCashierShiftLabel({
        registerNumber: 3,
        openedAt: '2026-09-17T09:05:00+05:00',
      }),
    ).toBe('3');
    expect(
      formatCashierShiftLabel({
        shiftRegisterNumber: 7,
        shiftOpenedAt: '2026-09-17T09:05:00+05:00',
      }),
    ).toBe('7');
  });

  it('uses open time when no register number', () => {
    expect(
      formatCashierShiftLabel({
        receiptNumber: 'PHR-20260917-0001',
        shiftOpenedAt: '2026-09-17T09:05:00+05:00',
      }),
    ).toMatch(/17\.09\.2026/);
  });

  it('does not invent shift from receipt digits or uuid', () => {
    expect(
      formatCashierShiftLabel({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        receiptNumber: 'PHR-20260917-0001',
      }),
    ).toBe('—');
  });

  it('uses env only as last resort', () => {
    expect(
      formatCashierShiftLabel(
        { receiptNumber: 'PHR-20260917-0001' },
        { envShiftNo: '12' },
      ),
    ).toBe('12');
  });

  it('prefers real shift open time over env (same label on receipt and My Sales)', () => {
    const opened = '2026-09-18T10:15:00+05:00';
    const fromSale = formatCashierShiftLabel(
      { shiftOpenedAt: opened, receiptNumber: 'PHR-20260918-0009' },
      { envShiftNo: '001' },
    );
    const fromShift = formatCashierShiftLabel(
      { openedAt: opened, id: 'uuid-should-not-appear' },
      { envShiftNo: '001' },
    );
    expect(fromSale).toBe(fromShift);
    expect(fromSale).not.toBe('001');
    expect(fromSale).toMatch(/18\.09\.2026/);
  });

  it('uses z-report id when open time missing', () => {
    expect(formatCashierShiftLabel({ shiftZReportId: 44 })).toBe('44');
    expect(formatCashierShiftLabel({ zReportId: 45 })).toBe('45');
  });
});
