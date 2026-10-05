import { describe, expect, it } from 'vitest';
import { nextRegisterScanBurst, REGISTER_SCAN_GAP_MS } from './registerScanBurst';

describe('nextRegisterScanBurst', () => {
  it('treats a fast second character as a scanner burst', () => {
    const first = nextRegisterScanBurst({ at: 0, len: 0, burst: false }, '4', 1000);
    const second = nextRegisterScanBurst(first, '46', 1000 + 20);
    expect(first.burst).toBe(false);
    expect(second.burst).toBe(true);
  });

  it('keeps slow typing as a manual search', () => {
    const first = nextRegisterScanBurst({ at: 0, len: 0, burst: false }, 'м', 1000);
    const second = nextRegisterScanBurst(first, 'мо', 1000 + REGISTER_SCAN_GAP_MS + 40);
    expect(second.burst).toBe(false);
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
