import { describe, expect, it, vi } from 'vitest';
import { tasnifApi } from '../../../api/tasnif.api';
import {
  enrichFiscalPackageCodes,
  isRealFiscalPackageCode,
  packageMeasureKind,
  pickTasnifPackage,
  resolveFiscalPackageName,
} from './resolveFiscalPackageCodes';

vi.mock('../../../api/tasnif.api', () => ({
  tasnifApi: { detail: vi.fn() },
}));

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

  it('picks grams when the product unit is grams and kilograms is also listed', () => {
    const pkg = pickTasnifPackage({
      packages: [
        { code: '1546940', nameRu: 'килограмм' },
        { code: '1546941', nameRu: 'грамм' },
      ],
    }, { unitCode: 'G', quantity: 200 });
    expect(pkg.code).toBe('1546941');
    expect(packageMeasureKind({ nameRu: 'килограмм' })).toBe('KG');
    expect(packageMeasureKind({ nameRu: 'грамм' })).toBe('G');
  });

  it('does not substitute kilograms when the classifier has no gram package', () => {
    const pkg = pickTasnifPackage({
      packages: [{ code: '1546940', nameRu: 'килограмм' }],
    }, { unitCode: 'G' });
    expect(pkg).toBeNull();
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

describe('enrichFiscalPackageCodes', () => {
  it('replaces a stored kilogram package with the gram package for a gram product', async () => {
    tasnifApi.detail.mockResolvedValue({
      data: {
        packages: [
          { code: '1546940', nameRu: 'килограмм' },
          { code: '1546941', nameRu: 'грамм' },
        ],
      },
    });
    const [line] = await enrichFiscalPackageCodes([{
      ikpu: '03214001014000010',
      packageCode: '1546940',
      unitCode: 'G',
      quantity: 200,
    }]);
    expect(line.packageCode).toBe('1546941');
    expect(line.packageName).toBe('грамм');
    expect(line.quantity).toBe(200);
  });
});

describe('resolveFiscalPackageName', () => {
  it('does not send a kilogram name for a gram line', () => {
    expect(resolveFiscalPackageName({
      unitCode: 'G',
      packageName: 'килограмм',
      unitOfMeasure: 'g',
    })).toBe('g');
    expect(resolveFiscalPackageName({
      unitCode: 'G',
      packageName: 'грамм',
    })).toBe('грамм');
  });
});
