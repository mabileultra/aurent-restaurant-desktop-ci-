import { describe, expect, it } from 'vitest';
import { posBarcodeCandidates } from './posBarcodeCandidates';

describe('posBarcodeCandidates', () => {
  it('EAN-13: сам код, без check digit и GTIN-14 с ведущим 0', () => {
    expect(posBarcodeCandidates('8801046877388')).toEqual([
      '8801046877388',
      '880104687738',
      '08801046877388',
    ]);
  });

  it('GTIN-14 с 0 → EAN-13', () => {
    expect(posBarcodeCandidates('08801046877388')).toEqual([
      '08801046877388',
      '8801046877388',
    ]);
  });
});
