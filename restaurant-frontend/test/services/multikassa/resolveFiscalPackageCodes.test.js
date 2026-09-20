import { describe, expect, it } from 'vitest';
import { isRealFiscalPackageCode, pickTasnifPackage } from '../../../src/services/multikassa/resolveFiscalPackageCodes';

describe('pickTasnifPackage', () => {
  it('skips unit code 1 and takes the Tasnif package', () => {
    const pkg = pickTasnifPackage({
      packages: [{ code: '1', nameRu: 'шт' }, { code: '1546940', nameRu: 'упаковка' }],
    });
    expect(pkg.code).toBe('1546940');
    expect(isRealFiscalPackageCode('1')).toBe(false);
  });

  it('picks the pack that matches № in the product name', () => {
    const pkg = pickTasnifPackage({
      packages: [
        { code: '1151822', nameRu: 'упаковка=10 шт (пакетик)' },
        { code: '1146493', nameRu: 'шт (пакетик)' },
      ],
    }, { name: 'ТераФлю. Лимон №10' });
    expect(pkg.code).toBe('1151822');
  });

  it('falls back to a piece package instead of blocking the sale', () => {
    const pkg = pickTasnifPackage({
      packages: [
        { code: '1546940', nameRu: 'коробка' },
        { code: '1546941', nameRu: 'шт' },
      ],
    });
    expect(pkg.code).toBe('1546941');
  });
});
