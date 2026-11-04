import { describe, expect, it } from 'vitest';
import { resolvePharmacyApiError } from './resolvePharmacyApiError';

function tFrom(dict) {
  return (key, opts) => dict[key] ?? opts?.defaultValue ?? key;
}

describe('resolvePharmacyApiError', () => {
  it('uses i18n when PHARM_ code is translated', () => {
    const t = tFrom({
      'pharmacyErrors.PHARM_SHIFT_NOT_OPEN': 'Смена не открыта',
    });
    const error = {
      response: {
        data: { code: 'PHARM_SHIFT_NOT_OPEN', message: 'Смена не открыта. Откройте смену перед продажей.' },
      },
    };
    expect(resolvePharmacyApiError(error, t)).toBe('Смена не открыта');
  });

  it('falls back to backend message when translation is missing', () => {
    const t = tFrom({});
    const error = {
      response: {
        data: { code: 'PHARM_SKU_EXISTS', message: 'SKU уже занят' },
      },
    };
    expect(resolvePharmacyApiError(error, t)).toBe('SKU уже занят');
  });

  it('ignores non-pharmacy codes and uses backend message', () => {
    const t = tFrom({ 'pharmacyErrors.BAD_REQUEST': 'не должно использоваться' });
    const error = {
      response: { data: { code: 'BAD_REQUEST', message: 'Access denied' } },
    };
    expect(resolvePharmacyApiError(error, t)).toBe('Access denied');
  });

  it('uses screen fallback when there is no code or message', () => {
    const t = tFrom({ 'pharmacyStock.saveFailed': 'Не удалось сохранить' });
    expect(resolvePharmacyApiError({}, t)).toBe('Не удалось сохранить');
  });
});
