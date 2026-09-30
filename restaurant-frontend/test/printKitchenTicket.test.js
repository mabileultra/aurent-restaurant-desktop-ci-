import { describe, expect, it } from 'vitest';
import { resolveStationPrinter } from '../src/restaurant/pos/utils/printKitchenTicket';

describe('resolveStationPrinter', () => {
  it('matches station id case-insensitively', () => {
    const id = 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890';
    const map = { [id.toLowerCase()]: 'Shashlik' };
    expect(resolveStationPrinter(map, id.toUpperCase())).toBe('Shashlik');
  });

  it('falls back only when exactly one printer is configured', () => {
    expect(resolveStationPrinter({ a: 'Salat' }, null)).toBe('Salat');
    expect(resolveStationPrinter({ a: 'Salat', b: 'Shashlik' }, null)).toBe('');
  });
});
