import { describe, expect, it } from 'vitest';
import {
  productAttr,
  productBatch,
  productDosageForm,
  productExpiry,
  productPieceStep,
  productSellByPiece,
  productStorageLocation,
} from './pharmacyProductMeta';

describe('productSellByPiece', () => {
  it('defaults to allowed when pack has many units', () => {
    expect(productSellByPiece({ attributes: { units_in_pack: '100' } })).toBe(true);
  });

  it('honors explicit disable', () => {
    expect(productSellByPiece({
      attributes: { units_in_pack: '100', sell_by_piece: 'false' },
    })).toBe(false);
    expect(productSellByPiece({
      attributes: { units_in_pack: '100' },
      soldIndividually: false,
    })).toBe(false);
  });

  it('is off for single-unit products', () => {
    expect(productSellByPiece({ attributes: { units_in_pack: '1' } })).toBe(false);
  });

  it('reads piece step below pack size', () => {
    expect(productPieceStep({ attributes: { units_in_pack: '100', piece_step: '10' } })).toBe(10);
    expect(productPieceStep({ attributes: { units_in_pack: '100', piece_step: '100' } })).toBe(1);
  });
});

describe('pharmacy product meta fields', () => {
  it('reads shelf from top-level without attributes', () => {
    expect(productStorageLocation({ storageLocation: 'A-12' })).toBe('A-12');
    expect(productAttr({ storageLocation: 'B-1' }, 'storageLocation')).toBe('B-1');
  });

  it('reads form from attributes and retail extras', () => {
    expect(productDosageForm({ attributes: { dosage_form: 'таб' } })).toBe('таб');
    expect(productDosageForm({ retailExtras: { pharmacyDosageForm: 'сироп' } })).toBe('сироп');
  });

  it('reads batch and expiry from FEFO fields', () => {
    expect(productBatch({ lotBatch: 'NP0867' })).toBe('NP0867');
    expect(productExpiry({ lotExpiry: '2026-02-09' })).toBe('2026-02-09');
  });
});
