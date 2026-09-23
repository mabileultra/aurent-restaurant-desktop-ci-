import { describe, expect, it } from 'vitest';
import {
  filterPlausibleImportMarkCodes,
  isPlausibleImportMarkCode,
} from './isPlausibleImportMarkCode';

describe('isPlausibleImportMarkCode', () => {
  it('accepts DataMatrix-like codes', () => {
    expect(isPlausibleImportMarkCode('010478001234567821AAAA91EE')).toBe(true);
  });

  it('rejects Didox marked flag and short noise', () => {
    expect(isPlausibleImportMarkCode('Маркировкаланган')).toBe(false);
    expect(isPlausibleImportMarkCode('Markirovkalangan')).toBe(false);
    expect(isPlausibleImportMarkCode('short')).toBe(false);
    expect(filterPlausibleImportMarkCodes(['Маркировкаланган', '010478001234567821AAAA91EE']))
      .toEqual(['010478001234567821AAAA91EE']);
  });
});
