import { describe, expect, it } from 'vitest';
import { isFiscalShiftAlreadyOpenError } from './isFiscalShiftAlreadyOpenError';

describe('isFiscalShiftAlreadyOpenError', () => {
  it('treats an already-open fiscal shift as idempotent', () => {
    expect(isFiscalShiftAlreadyOpenError(new Error('Смена уже открыта'))).toBe(true);
    expect(isFiscalShiftAlreadyOpenError(new Error('Смена открыта'))).toBe(true);
    expect(isFiscalShiftAlreadyOpenError(new Error('Shift already opened'))).toBe(true);
    expect(isFiscalShiftAlreadyOpenError(new Error('Smena allaqachon ochiq'))).toBe(true);
  });

  it('does not treat a closed fiscal shift as already open', () => {
    expect(isFiscalShiftAlreadyOpenError(new Error('Смена не открыта'))).toBe(false);
    expect(isFiscalShiftAlreadyOpenError(new Error('Не удалось связаться с Multikassa'))).toBe(false);
  });
});
