import { describe, expect, it } from 'vitest';
import {
  productPieceStep,
  productSellByPiece,
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
