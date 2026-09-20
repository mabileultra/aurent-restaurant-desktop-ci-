import { describe, expect, it } from 'vitest';
import { toIdentificationMarkingCode, toOfdMarkingLabel } from '../../../src/services/multikassa/ofdMarkingLabel';

const FULL =
  '0108906002059409218MTGE3S706TDT91UZF092enFQOcSQ9jQzKA16EsBIzjMGF9RCYf1JZd2ReSG6eiU=';
const IDENT = '0108906002059409218MTGE3S706TDT';

describe('ofdMarkingLabel', () => {
  it('strips crypto tail from a concatenated scan', () => {
    expect(toIdentificationMarkingCode(FULL)).toBe(IDENT);
    expect(toOfdMarkingLabel(FULL)).toBe(IDENT);
  });

  it('keeps identification already without crypto', () => {
    expect(toOfdMarkingLabel(IDENT)).toBe(IDENT);
  });

  it('cuts at GS before crypto AIs', () => {
    expect(toOfdMarkingLabel(`${IDENT}\u001d91UZF0\u001d92abc`)).toBe(IDENT);
  });

  it('returns empty for blank input', () => {
    expect(toOfdMarkingLabel('')).toBe('');
    expect(toOfdMarkingLabel(null)).toBe('');
  });
});
