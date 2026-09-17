import { describe, expect, it } from 'vitest';
import { isRealFiscalPackageCode, pickTasnifPackage } from './resolveFiscalPackageCodes';

describe('pickTasnifPackage', () => {
  it('skips unit code 1 and takes the Tasnif package', () => {
    const pkg = pickTasnifPackage({
      packages: [{ code: '1', nameRu: 'шт' }, { code: '1546940', nameRu: 'упаковка' }],
    });
    expect(pkg.code).toBe('1546940');
    expect(isRealFiscalPackageCode('1')).toBe(false);
  });

  it('does not guess when several real packages exist', () => {
    expect(pickTasnifPackage({
      packages: [
        { code: '1546940', nameRu: 'блистер' },
        { code: '1546941', nameRu: 'коробка' },
      ],
    })).toBeNull();
  });
});
