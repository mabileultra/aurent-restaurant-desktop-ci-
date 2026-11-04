import { round2 } from '../../../utils/taxAmounts';

export function normalizePackPieces(packs, pieces, unitsInPack) {
  const units = Number(unitsInPack) > 1 ? Number(unitsInPack) : 1;
  let packQty = Math.max(0, Math.floor(Number(packs) || 0));
  let pieceQty = Math.max(0, Math.floor(Number(pieces) || 0));
  if (units > 1 && pieceQty >= units) {
    packQty += Math.floor(pieceQty / units);
    pieceQty %= units;
  }
  return { packs: packQty, pieces: pieceQty, unitsInPack: units };
}

export function toCartQuantity({ packs, pieces, unitsInPack, sellByPiece }) {
  const n = normalizePackPieces(packs, pieces, unitsInPack);
  if (!sellByPiece || n.unitsInPack <= 1) return n.packs;
  return n.packs * n.unitsInPack + n.pieces;
}

export function fromCartQuantity(quantity, unitsInPack, sellByPiece) {
  const qty = Math.max(0, Math.round(Number(quantity) || 0));
  const units = Number(unitsInPack) > 1 ? Number(unitsInPack) : 1;
  if (!sellByPiece || units <= 1) {
    return { packs: qty, pieces: 0, unitsInPack: units };
  }
  return {
    packs: Math.floor(qty / units),
    pieces: qty % units,
    unitsInPack: units,
  };
}

export function packPieceLineTotal({ packs, pieces, packPrice, piecePrice }) {
  const n = normalizePackPieces(packs, pieces, 1_000_000);
  return round2((Number(packPrice) || 0) * n.packs + (Number(piecePrice) || 0) * n.pieces);
}

export function toPackStockQty({ packs, pieces, unitsInPack }) {
  const n = normalizePackPieces(packs, pieces, unitsInPack);
  if (n.unitsInPack <= 1) return n.packs;
  return n.packs + n.pieces / n.unitsInPack;
}

export function pieceStepHintValues(step, unitsInPack) {
  const s = Math.max(1, Math.round(Number(step) || 1));
  const units = Number(unitsInPack) > 1 ? Number(unitsInPack) : 1;
  if (s <= 1 || s >= units) return [];
  const values = [];
  for (let n = s; n < units; n += s) values.push(n);
  return values;
}

export function formatCartPackPieceQty(quantity, unitsInPack, sellByPiece, labels = { pack: 'уп', piece: 'шт' }) {
  const n = fromCartQuantity(quantity, unitsInPack, sellByPiece);
  if (!sellByPiece || n.unitsInPack <= 1) {
    return String(n.packs || 0);
  }
  if (n.packs > 0 && n.pieces > 0) return `${n.packs} ${labels.pack} + ${n.pieces} ${labels.piece}`;
  if (n.packs > 0) return `${n.packs} ${labels.pack}`;
  return `${n.pieces} ${labels.piece}`;
}

export function validatePackPieceQty({
  packs,
  pieces,
  unitsInPack,
  sellByPiece,
  pieceStep,
  stockPacks,
}, t) {
  const n = normalizePackPieces(packs, pieces, unitsInPack);
  if (!sellByPiece) {
    n.pieces = 0;
  }
  if (n.packs <= 0 && n.pieces <= 0) {
    return t('pharmacyCashier.qtyInvalid');
  }
  const step = Math.max(1, Math.round(Number(pieceStep) || 1));
  if (sellByPiece && n.unitsInPack > 1 && step > 1 && n.pieces % step !== 0) {
    return t('pharmacyCashier.pieceStepInvalid', { step });
  }
  const stock = Number(stockPacks);
  if (Number.isFinite(stock) && stock > 0) {
    const need = toPackStockQty(n);
    if (need - stock > 0.0005) {
      return t('pharmacyCashier.qtyExceedsStock');
    }
  }
  return null;
}
