import { describe, expect, it } from 'vitest';
import {
  translateValidationError,
  translateRawErrorMessage,
} from './validationErrorTranslator';

describe('validationErrorTranslator', () => {
  it('translates regionCode and districtCode constraint errors to Uzbek', () => {
    expect(translateValidationError('regionCode', 'must not be blank')).toBe(
      'Viloyat tanlanishi yoki kiritilishi shart'
    );
    expect(translateValidationError('districtCode', 'must not be blank')).toBe(
      'Tuman tanlanishi yoki kiritilishi shart'
    );
    expect(translateValidationError('name', 'must not be blank')).toBe(
      'Nomi tanlanishi yoki kiritilishi shart'
    );
  });

  it('falls back to rawMessage for unknown constraints', () => {
    expect(translateValidationError('customField', 'is invalid custom format')).toBe(
      'is invalid custom format'
    );
  });

  it('translates raw error message strings containing common backend errors', () => {
    expect(translateRawErrorMessage('regionCode: must not be blank')).toBe(
      'Viloyat tanlanishi shart'
    );
    expect(translateRawErrorMessage('Validation failed')).toBe(
      'Kiritilgan ma’lumotlar tekshiruvdan o‘tmadi'
    );
    expect(translateRawErrorMessage('Validation failed for object=createCompanyRequest. Error count: 1')).toBe(
      'Kiritilgan ma’lumotlar tekshiruvdan o‘tmadi'
    );
    expect(translateRawErrorMessage('Business type is not allowed for this company')).toBe(
      'Tanlangan faoliyat turi ushbu kompaniyaga biriktirilmagan'
    );
  });
});
