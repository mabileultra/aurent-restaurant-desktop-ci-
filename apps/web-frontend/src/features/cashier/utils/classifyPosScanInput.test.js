import { describe, expect, it } from 'vitest';
import { classifyPosScanInput } from './classifyPosScanInput';

describe('classifyPosScanInput — жёсткое разделение КМ / штрихкод', () => {
  it('пустой ввод', () => {
    expect(classifyPosScanInput('')).toBe('empty');
    expect(classifyPosScanInput('   ')).toBe('empty');
    expect(classifyPosScanInput(null)).toBe('empty');
  });

  it('обычный EAN/штрихкод → barcode (путь налога без ASL)', () => {
    expect(classifyPosScanInput('4780012345678')).toBe('barcode');
    expect(classifyPosScanInput('4601234567890')).toBe('barcode');
    expect(classifyPosScanInput('12345678')).toBe('barcode');
  });

  it('DataMatrix КМ → marking (отдельный путь)', () => {
    expect(classifyPosScanInput('010478001234567821AbCdEfGhIj')).toBe('marking');
    expect(classifyPosScanInput('(01)04780012345678(21)SERIAL01')).toBe('marking');
    expect(classifyPosScanInput('01\u001d04780012345678\u001d21ABC')).toBe('marking');
  });

  it('QR чека ОФД — не маркировка', () => {
    expect(classifyPosScanInput(
      'https://ofd.soliq.uz/check?t=ZZ000000000000&r=3&c=20240904094538&s=320262508539',
    )).toBe('barcode');
  });

  it('пути не смешиваются: один код — один вид', () => {
    const ean = '4780012345678';
    const km = '010478001234567821XxYyZzAaBb';
    expect(classifyPosScanInput(ean)).not.toBe(classifyPosScanInput(km));
    expect(classifyPosScanInput(ean)).toBe('barcode');
    expect(classifyPosScanInput(km)).toBe('marking');
  });
});
