import { describe, expect, it } from 'vitest';
import {
  defaultReceiptFieldMap,
  isReceiptFieldOn,
  mergeReceiptFields,
} from '../../src/receiptProfile/receiptFieldCatalog';
import { mergeReceiptProfileEnvelope } from '../../src/receiptProfile/receiptProfileEnvelope';

describe('receiptFieldCatalog', () => {
  it('defaults every known field on', () => {
    const map = defaultReceiptFieldMap();
    expect(map.footer).toBe(true);
    expect(map.qrCode).toBe(true);
  });

  it('merges only known boolean keys', () => {
    const merged = mergeReceiptFields({ footer: false, unknown: false, qrCode: 'no' });
    expect(merged.footer).toBe(false);
    expect(merged.qrCode).toBe(true);
    expect(merged.unknown).toBeUndefined();
  });

  it('isReceiptFieldOn treats missing as on', () => {
    expect(isReceiptFieldOn(null, 'footer')).toBe(true);
    expect(isReceiptFieldOn({ footer: false }, 'footer')).toBe(false);
  });
});

describe('receiptProfileEnvelope', () => {
  it('reserves uiTheme null by default', () => {
    const env = mergeReceiptProfileEnvelope({ receiptFields: { footer: false } });
    expect(env.version).toBe(1);
    expect(env.receiptFields.footer).toBe(false);
    expect(env.uiTheme).toBeNull();
  });
});
