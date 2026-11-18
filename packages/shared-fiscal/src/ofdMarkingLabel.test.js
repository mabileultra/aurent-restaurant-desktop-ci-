import { describe, expect, it } from 'vitest';
import {
  resolveItemBarcode,
  resolveItemMarkingLabel,
  toIdentificationMarkingCode,
  toOfdMarkingLabel,
} from './ofdMarkingLabel.js';

const FULL =
  '0108906002059409218MTGE3S706TDT91UZF092enFQOcSQ9jQzKA16EsBIzjMGF9RCYf1JZd2ReSG6eiU=';
const IDENT = '0108906002059409218MTGE3S706TDT';

describe('@aurent/shared-fiscal ofdMarkingLabel', () => {
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

  it('Чёрное золото: 93 в хвосте скана режется как крипто, не как серия', () => {
    const scanned = '0104780131182498217?ыПдК793Тоы2';
    expect(toOfdMarkingLabel(scanned)).toBe('0104780131182498217?ыПдК7');
  });

  it('resolves item barcode correctly or returns empty string', () => {
    expect(resolveItemBarcode({ barcode: '4780001470012' })).toBe('4780001470012');
    expect(resolveItemBarcode({ sku: 'SKU-9988' })).toBe('SKU-9988');
    expect(resolveItemBarcode({ barCode: '4780001470012' })).toBe('4780001470012');
    expect(resolveItemBarcode({})).toBe('');
    expect(resolveItemBarcode(null)).toBe('');
  });

  it('resolves item marking label matching fiscal module or returns empty string', () => {
    expect(resolveItemMarkingLabel({ markingCode: FULL })).toBe(IDENT);
    expect(resolveItemMarkingLabel({ productMark: FULL })).toBe(IDENT);
    expect(resolveItemMarkingLabel({ productMarks: [FULL] })).toBe(IDENT);
    expect(resolveItemMarkingLabel({ productLabel: FULL })).toBe(IDENT);
    expect(resolveItemMarkingLabel({ km: FULL })).toBe(IDENT);
    expect(resolveItemMarkingLabel({ markingCode: 'short' })).toBe('');
    expect(resolveItemMarkingLabel({})).toBe('');
    expect(resolveItemMarkingLabel(null)).toBe('');
  });
});
