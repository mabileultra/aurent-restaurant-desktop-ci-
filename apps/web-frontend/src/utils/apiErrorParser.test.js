import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '../i18n/config';
import {
  applyServerValidationErrors,
  buildErrorReferenceCode,
  extractFieldErrors,
  formatApiErrorMessage,
  parseApiError,
} from './apiErrorParser';

describe('apiErrorParser', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('uz');
  });
  it('generates deterministic error reference code', () => {
    const code500 = buildErrorReferenceCode(500, { message: 'DB deadlock' });
    expect(code500).toMatch(/^#ERR-500-[0-9A-F]{4}$/);

    const codeNet = buildErrorReferenceCode(null, { message: 'Network Error' });
    expect(codeNet).toMatch(/^#ERR-NET-[0-9A-F]{4}$/);

    const codeUi = buildErrorReferenceCode(null, new ReferenceError("Cannot access 'x' before initialization"));
    expect(codeUi).toMatch(/^#ERR-UI-[0-9A-F]{4}$/);

    // Uses server referenceId if provided
    const withRef = buildErrorReferenceCode(500, { response: { data: { referenceId: 'REF-999' } } });
    expect(withRef).toBe('REF-999');
  });

  it('extracts field validation errors from array and object formats', () => {
    // Array format
    const arrayFormat = {
      errors: [
        { field: 'companyTin', defaultMessage: 'STIR 9 xonali bo‘lishi shart' },
        { field: 'phone', defaultMessage: 'Telefon raqam noto‘g‘ri' },
      ],
    };
    const extracted1 = extractFieldErrors(arrayFormat);
    expect(extracted1).toEqual({
      companyTin: 'STIR 9 xonali bo‘lishi shart',
      phone: 'Telefon raqam noto‘g‘ri',
    });

    // Object format
    const objFormat = {
      errors: {
        name: ['Nom kiritilishi shart'],
        balance: 'Balans 0 dan kam bo‘lmasin',
      },
    };
    const extracted2 = extractFieldErrors(objFormat);
    expect(extracted2).toEqual({
      name: 'Nom kiritilishi shart',
      balance: 'Balans 0 dan kam bo‘lmasin',
    });

    // Null/empty
    expect(extractFieldErrors(null)).toBeNull();
    expect(extractFieldErrors({})).toBeNull();
  });

  it('parses network errors properly', () => {
    const netErr = { code: 'ERR_NETWORK', message: 'Network Error' };
    const parsed = parseApiError(netErr);
    expect(parsed.isNetwork).toBe(true);
    expect(parsed.status).toBeNull();
    expect(parsed.message).toContain('Internet');
  });

  it('parses offline browser condition with distinct wifi offline message', () => {
    const originalOnLine = navigator.onLine;
    try {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      const parsed = parseApiError({ code: 'ERR_NETWORK' });
      expect(parsed.isNetwork).toBe(true);
      expect(parsed.message).toContain('Internet aloqasi uzildi');
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
    }
  });

  it('parses 401 unauthorized errors', () => {
    const err = { response: { status: 401 } };
    const parsed = parseApiError(err);
    expect(parsed.isAuth).toBe(true);
    expect(parsed.message).toContain('Sessiya');
  });

  it('parses 403 forbidden errors', () => {
    const err = { response: { status: 403 } };
    const parsed = parseApiError(err);
    expect(parsed.isForbidden).toBe(true);
    expect(parsed.message).toContain('huquq');
  });

  it('parses 422 validation errors and extracts primary field message', () => {
    const err = {
      response: {
        status: 422,
        data: {
          errors: {
            tin: 'STIR allaqachon ro‘yxatdan o‘tgan',
          },
        },
      },
    };
    const parsed = parseApiError(err);
    expect(parsed.fieldErrors).toBeDefined();
    expect(parsed.message).toBe('STIR allaqachon ro‘yxatdan o‘tgan');
  });

  it('parses 500 server errors', () => {
    const err = {
      response: {
        status: 500,
        data: { message: 'Internal Server Error java.lang.NullPointerException' },
      },
    };
    const parsed = parseApiError(err);
    expect(parsed.status).toBe(500);
    expect(parsed.message).toContain('Serverda ichki xatolik');
  });

  it('formatApiErrorMessage returns plain string', () => {
    const msg = formatApiErrorMessage({ response: { status: 404 } });
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('applyServerValidationErrors invokes setError for all fields', () => {
    const mockSetError = (field, err) => {
      errorsReceived[field] = err;
    };
    const errorsReceived = {};

    const err = {
      response: {
        status: 400,
        data: {
          errors: {
            title: 'Sarlavha kiritilmadi',
            amount: 'Summa noto‘g‘ri',
          },
        },
      },
    };

    const applied = applyServerValidationErrors(err, mockSetError);
    expect(applied).toBe(true);
    expect(errorsReceived.title).toEqual({ type: 'server', message: 'Sarlavha kiritilmadi' });
    expect(errorsReceived.amount).toEqual({ type: 'server', message: 'Summa noto‘g‘ri' });
  });

  it('translates errors to Russian when language is switched', async () => {
    await i18n.changeLanguage('ru');
    const err = { response: { status: 403 } };
    const parsed = parseApiError(err);
    expect(parsed.message).toContain('У вас недостаточно прав');
  });
});
