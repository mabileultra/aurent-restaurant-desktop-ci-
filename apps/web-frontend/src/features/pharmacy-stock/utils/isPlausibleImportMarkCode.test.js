import { describe, expect, it } from 'vitest';
import {
  filterPlausibleImportMarkCodes,
  isPlausibleImportMarkCode,
} from './isPlausibleImportMarkCode';

describe('isPlausibleImportMarkCode', () => {
  it('accepts DataMatrix-like codes', () => {
    expect(isPlausibleImportMarkCode('010478001234567821AAAA91EE')).toBe(true);
  });

  it('rejects Didox flag, IKPU and short noise — not QR КМ', () => {
    expect(isPlausibleImportMarkCode('Маркировкаланган')).toBe(false);
    expect(isPlausibleImportMarkCode('Markirovkalangan')).toBe(false);
    expect(isPlausibleImportMarkCode('03004409005039001')).toBe(false);
    expect(isPlausibleImportMarkCode('short')).toBe(false);
    expect(filterPlausibleImportMarkCodes([
      'Маркировкаланган',
      '03004409005039001',
      '010478001234567821AAAA91EE',
    ])).toEqual(['010478001234567821AAAA91EE']);
  });
});
