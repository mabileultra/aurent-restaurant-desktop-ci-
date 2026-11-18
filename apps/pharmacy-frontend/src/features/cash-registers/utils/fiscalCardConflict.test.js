import { describe, it, expect } from 'vitest';
import {
  normalizeFiscalCardId,
  findFiscalCardConflict,
  formatFiscalCardConflictMessage,
  isConflictApiError,
} from './fiscalCardConflict';

describe('fiscalCardConflict (pharmacy)', () => {
  it('detects duplicate fiscalCardId across registers ignoring self', () => {
    const rows = [
      { id: 1, registerNumber: 1, storeName: 'Аптека №1', fiscalCardId: 'UZ210317231786' },
      { id: 2, registerNumber: 2, storeName: 'Аптека №2', fiscalCardId: 'TEST-FM-001' },
    ];

    expect(normalizeFiscalCardId(' UZ210317231786 ')).toBe('uz210317231786');
    expect(findFiscalCardConflict(rows, { fiscalCardId: 'uz210317231786' })).toEqual(rows[0]);
    expect(
      findFiscalCardConflict(rows, { fiscalCardId: 'uz210317231786', ignoreRegisterId: 1 })
    ).toBeNull();
    expect(isConflictApiError({ response: { status: 409 } })).toBe(true);

    const t = (key, opts) => `${key}:${opts?.number ?? ''}:${opts?.store ?? ''}`;
    expect(formatFiscalCardConflictMessage(t, rows[0])).toBe(
      'cashRegisters.fiscalCardConflictWithRegister:1:Аптека №1'
    );
  });
});
