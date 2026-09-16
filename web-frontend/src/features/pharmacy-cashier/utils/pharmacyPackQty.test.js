import { describe, expect, it } from 'vitest';
import {
  formatCartPackPieceQty,
  fromCartQuantity,
  normalizePackPieces,
  packPieceLineTotal,
  pieceStepHintValues,
  toCartQuantity,
  toPackStockQty,
  validatePackPieceQty,
} from './pharmacyPackQty';

describe('pharmacyPackQty', () => {
  it('carries pieces into packs', () => {
    expect(normalizePackPieces(1, 100, 100)).toEqual({ packs: 2, pieces: 0, unitsInPack: 100 });
    expect(normalizePackPieces(0, 110, 100)).toEqual({ packs: 1, pieces: 10, unitsInPack: 100 });
  });

  it('encodes mixed qty as pieces for the cart', () => {
    expect(toCartQuantity({ packs: 1, pieces: 10, unitsInPack: 100, sellByPiece: true })).toBe(110);
    expect(toCartQuantity({ packs: 2, pieces: 0, unitsInPack: 100, sellByPiece: false })).toBe(2);
  });

  it('splits cart pieces back to packs + leftovers', () => {
    expect(fromCartQuantity(110, 100, true)).toEqual({ packs: 1, pieces: 10, unitsInPack: 100 });
  });

  it('totals pack price plus piece price', () => {
    expect(packPieceLineTotal({
      packs: 1,
      pieces: 10,
      packPrice: 80000,
      piecePrice: 800,
    })).toBe(88000);
  });

  it('checks stock in packs', () => {
    expect(toPackStockQty({ packs: 1, pieces: 10, unitsInPack: 100 })).toBe(1.1);
    expect(validatePackPieceQty({
      packs: 2,
      pieces: 0,
      unitsInPack: 100,
      sellByPiece: false,
      stockPacks: 1,
    }, (k) => k)).toBe('pharmacyCashier.qtyExceedsStock');
  });

  it('rejects pieces outside the step', () => {
    expect(validatePackPieceQty({
      packs: 0,
      pieces: 7,
      unitsInPack: 100,
      sellByPiece: true,
      pieceStep: 10,
      stockPacks: 5,
    }, (k) => k)).toBe('pharmacyCashier.pieceStepInvalid');
    expect(pieceStepHintValues(10, 100).slice(0, 4)).toEqual([10, 20, 30, 40]);
  });

  it('formats mixed cart qty', () => {
    expect(formatCartPackPieceQty(110, 100, true)).toBe('1 уп + 10 шт');
    expect(formatCartPackPieceQty(2, 100, false)).toBe('2');
  });
});
