import { describe, it, expect } from 'vitest';
import {
  normalizeFiscalCardId,
  findFiscalCardConflict,
  formatFiscalCardConflictMessage,
  isConflictApiError,
} from '../../../src/features/cash-registers/utils/fiscalCardConflict';

describe('fiscalCardConflict', () => {
  it('normalizes whitespace and casing', () => {
    expect(normalizeFiscalCardId('  UZ210317231786  ')).toBe('uz210317231786');
    expect(normalizeFiscalCardId(null)).toBe('');
  });

  it('finds conflict ignoring current register id and empty inputs', () => {
    const rows = [
      { id: 10, registerNumber: 1, storeName: 'Центр', fiscalCardId: 'UZ210317231786' },
      { id: 11, registerNumber: 2, storeName: 'Юнусабад', fiscalCardId: 'TEST-FM-001' },
    ];

    expect(findFiscalCardConflict(rows, { fiscalCardId: ' test-fm-001 ' })).toEqual(rows[1]);
    expect(
      findFiscalCardConflict(rows, { fiscalCardId: 'test-fm-001', ignoreRegisterId: 11 })
    ).toBeNull();
    expect(findFiscalCardConflict(rows, { fiscalCardId: '   ' })).toBeNull();
  });

  it('formats conflict message with register number and store name', () => {
    const t = (key, opts) => `${key}:${opts?.number ?? ''}:${opts?.store ?? ''}`;
    expect(
      formatFiscalCardConflictMessage(t, { id: 10, registerNumber: 2, storeName: 'Центр' })
    ).toBe('cashRegisters.fiscalCardConflictWithRegister:2:Центр');
    expect(formatFiscalCardConflictMessage(t, { id: 10, registerNumber: 2 })).toBe(
      'cashRegisters.fiscalCardConflictWithNumber:2:'
    );
    expect(formatFiscalCardConflictMessage(t, null)).toBe('cashRegisters.fiscalCardConflict::');
  });

  it('detects 409 conflict API errors', () => {
    expect(isConflictApiError({ response: { status: 409 } })).toBe(true);
    expect(isConflictApiError({ response: { data: { code: 'CONFLICT' } } })).toBe(true);
    expect(isConflictApiError({ response: { status: 400 } })).toBe(false);
  });
});
