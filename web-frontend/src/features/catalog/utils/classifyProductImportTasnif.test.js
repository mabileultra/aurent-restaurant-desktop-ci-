import { describe, expect, it } from 'vitest';
import {
  classifyProductImportTasnif,
  summarizeProductImportTasnif,
} from './classifyProductImportTasnif';

describe('classifyProductImportTasnif — светофор', () => {
  it('дубликат и ошибка важнее тасниф', () => {
    expect(classifyProductImportTasnif({ status: 'DUPLICATE' }, { status: 'found' })).toBe('duplicate');
    expect(classifyProductImportTasnif({ status: 'INVALID' }, { status: 'found' })).toBe('invalid');
  });

  it('зелёный — штрихкод / ИКПУ', () => {
    expect(
      classifyProductImportTasnif({ status: 'NEW' }, { status: 'found', matchSource: 'barcode' })
    ).toBe('found');
    expect(
      classifyProductImportTasnif({ status: 'NEW' }, { status: 'found', matchSource: 'ikpu' })
    ).toBe('found');
  });

  it('жёлтый — найдено по имени', () => {
    expect(
      classifyProductImportTasnif({ status: 'NEW' }, { status: 'found', matchSource: 'name' })
    ).toBe('partial');
  });

  it('красный — не найдено', () => {
    expect(
      classifyProductImportTasnif({ status: 'NEW' }, { status: 'missing' })
    ).toBe('missing');
  });

  it('ожидание пока checking/idle', () => {
    expect(classifyProductImportTasnif({ status: 'NEW' }, null)).toBe('idle');
    expect(classifyProductImportTasnif({ status: 'NEW' }, { status: 'checking' })).toBe('idle');
  });
});

describe('summarizeProductImportTasnif', () => {
  it('считает все тона', () => {
    const rows = [
      { rowNum: 1, status: 'NEW' },
      { rowNum: 2, status: 'NEW' },
      { rowNum: 3, status: 'DUPLICATE' },
      { rowNum: 4, status: 'NEW' },
    ];
    const map = {
      1: { status: 'found', matchSource: 'barcode' },
      2: { status: 'found', matchSource: 'name' },
      4: { status: 'missing' },
    };
    expect(summarizeProductImportTasnif(rows, map)).toEqual({
      found: 1,
      partial: 1,
      missing: 1,
      duplicate: 1,
      invalid: 0,
      idle: 0,
      total: 4,
    });
  });
});
