import { describe, expect, it } from 'vitest';
import {
  buildTasnifExternalId,
  buildTasnifSku,
  isAutoTasnifExternalId,
  isAutoTasnifSku,
} from './tasnifProductIds';

describe('tasnifProductIds', () => {
  it('builds external id and sku from ikpu + package', () => {
    expect(buildTasnifExternalId('12345678901234', '10')).toBe('12345678901234:10');
    expect(buildTasnifSku('12345678901234', '10')).toBe('IKPU-12345678901234-P10');
  });

  it('treats empty external id as auto-replaceable', () => {
    expect(isAutoTasnifExternalId('', '123')).toBe(true);
    expect(isAutoTasnifSku('IKPU-123')).toBe(true);
    expect(isAutoTasnifSku('CUSTOM-1')).toBe(false);
  });
});
