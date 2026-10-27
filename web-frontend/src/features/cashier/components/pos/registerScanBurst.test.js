import { describe, expect, it } from 'vitest';
import {
  looksLikeRegisterScanInput,
  nextRegisterScanBurst,
  REGISTER_SCAN_GAP_MS,
} from './registerScanBurst';

describe('looksLikeRegisterScanInput', () => {
  it('digits-only barcode / PLU', () => {
    expect(looksLikeRegisterScanInput('4')).toBe(true);
    expect(looksLikeRegisterScanInput('4607123456789')).toBe(true);
  });

  it('marking / GS1 in progress', () => {
    expect(looksLikeRegisterScanInput('010478001234567821AbCd')).toBe(true);
    expect(looksLikeRegisterScanInput('01\u001d04780012345678')).toBe(true);
  });

  it('product name search is not a scan', () => {
    expect(looksLikeRegisterScanInput('молоко')).toBe(false);
    expect(looksLikeRegisterScanInput('mo')).toBe(false);
  });
});

describe('nextRegisterScanBurst', () => {
  it('keeps fast typing of a Latin name as a manual search', () => {
    const first = nextRegisterScanBurst({ at: 0, len: 0, burst: false }, 'm', 1000);
    const second = nextRegisterScanBurst(first, 'mo', 1000 + 20);
    expect(first.burst).toBe(false);
    expect(second.burst).toBe(false);
  });

  it('keeps slow typing of a name as a manual search', () => {
    const first = nextRegisterScanBurst({ at: 0, len: 0, burst: false }, 'м', 1000);
    const second = nextRegisterScanBurst(first, 'мо', 1000 + REGISTER_SCAN_GAP_MS + 40);
    expect(second.burst).toBe(false);
  });

  it('treats slow digit barcode on POS as a scan (not name search)', () => {
    const first = nextRegisterScanBurst({ at: 0, len: 0, burst: false }, '4', 1000);
    const second = nextRegisterScanBurst(
      first,
      '46',
      1000 + REGISTER_SCAN_GAP_MS + 40,
    );
    expect(first.burst).toBe(true);
    expect(second.burst).toBe(true);
  });

  it('keeps burst across a slow mid-code gap after a digit start', () => {
    const a = nextRegisterScanBurst({ at: 0, len: 0, burst: false }, '4', 1000);
    const b = nextRegisterScanBurst(a, '46', 1020);
    const c = nextRegisterScanBurst(b, '460', 1020 + REGISTER_SCAN_GAP_MS + 50);
    expect(b.burst).toBe(true);
    expect(c.burst).toBe(true);
  });

  it('treats one long code as a scanner burst', () => {
    const pasted = nextRegisterScanBurst({ at: 0, len: 0, burst: false }, '4607123456789', 1000);
    expect(pasted.burst).toBe(true);
  });

  it('drops the burst when the field is cleared', () => {
    const burst = nextRegisterScanBurst({ at: 1000, len: 4, burst: true }, '4607', 1020);
    const cleared = nextRegisterScanBurst(burst, '', 1100);
    expect(cleared.burst).toBe(false);
  });
});
