import { describe, it, expect } from 'vitest';
import { hasCyrillic, transliterateCyrillicToLatin } from './transliterateCyrillic';

describe('transliterateCyrillicToLatin', () => {
  it('keeps latin as-is', () => {
    expect(transliterateCyrillicToLatin('Granit 30x60')).toBe('Granit 30x60');
  });

  it('transliterates tile adhesive name (no Chinese mojibake on MK print)', () => {
    const name =
      'Клей плиточный, монтажный сухой для внутренних работ';
    const out = transliterateCyrillicToLatin(name);
    expect(hasCyrillic(out)).toBe(false);
    expect(out.toLowerCase()).toContain('kley');
    expect(out.toLowerCase()).toContain('plitochn');
  });
});
