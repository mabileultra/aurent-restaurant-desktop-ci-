import { describe, expect, it } from 'vitest';
import {
  extractSerialFromMarkingCode,
  markingIdentificationCode,
  markingIdentityKeys,
  marksShareIdentity,
} from './markingIdentity';

describe('markingIdentity', () => {
  it('shares gs1/id keys across crypto tails like pharmacy-service', () => {
    const base = '010307797292003921U=HqEW=YAVhNqy/Uasgl';
    const first = markingIdentityKeys(`${base}91EE1192ABCDEF`);
    const second = markingIdentityKeys(`${base}\u001d91FFFF\u001d92ZZZZ`);
    expect(first.some((k) => k.startsWith('id:'))).toBe(true);
    expect(first.some((k) => second.includes(k))).toBe(true);
    expect(extractSerialFromMarkingCode(`${base}91EE11`)).toBe('U=HqEW=YAVhNqy/Uasgl');
    expect(markingIdentificationCode(`${base}91EE11`)).toBe(base);
    expect(marksShareIdentity(`${base}91EE11`, `${base}\u001d91AAAA`)).toBe(true);
  });

  it('does not treat two packs of the same GTIN as one KM', () => {
    expect(marksShareIdentity(
      '010478001234567821PACK00191AAAA',
      '010478001234567821PACK00291AAAA',
    )).toBe(false);
  });
});
