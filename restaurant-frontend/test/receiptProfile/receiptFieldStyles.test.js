import { describe, expect, it } from 'vitest';
import {
  coerceReceiptFieldStyle,
  fieldControls,
  mergeReceiptFieldStyles,
  receiptFieldStyleClass,
  receiptFieldStyleVars,
} from '../../src/receiptProfile/receiptFieldStyles';

describe('receiptFieldStyles', () => {
  it('coerces legacy sm/md/lg and boolean bold to numeric', () => {
    expect(coerceReceiptFieldStyle({ size: 'lg', bold: true })).toEqual({
      sizePct: 130,
      boldPct: 100,
      align: 'left',
    });
    expect(coerceReceiptFieldStyle({ sizePct: 115, boldPct: 40, align: 'right' })).toEqual({
      sizePct: 115,
      boldPct: 40,
      align: 'right',
    });
  });

  it('merges known styles and clamps junk', () => {
    const merged = mergeReceiptFieldStyles({
      footer: { sizePct: 150, boldPct: 80, align: 'center' },
      qrCode: { size: 'huge', bold: 1, align: 'right' },
    });
    expect(merged.footer).toEqual({ sizePct: 150, boldPct: 80, align: 'center' });
    expect(merged.qrCode.sizePct).toBe(100);
    expect(merged.qrCode.boldPct).toBe(100);
    expect(merged.qrCode.align).toBe('right');
  });

  it('logo/qr have align only — no size/bold percent controls', () => {
    expect(fieldControls('logo')).toEqual({ size: false, bold: false, align: true });
    expect(fieldControls('qrCode')).toEqual({ size: false, bold: false, align: true });
    expect(fieldControls('companyName').size).toBe(true);
  });

  it('builds css class and vars', () => {
    expect(receiptFieldStyleClass({ align: 'right' })).toContain('rst-fiscal-field--align-right');
    const vars = receiptFieldStyleVars({ sizePct: 120, boldPct: 50 });
    expect(vars['--rst-fs-size']).toBe('120%');
    expect(Number(vars['--rst-fs-weight'])).toBeGreaterThan(400);
  });
});
