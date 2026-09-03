import { round2 } from '../../../utils/taxAmounts';
import { roundQty } from '../../../utils/quantityFormat';
import {
  productSellByUnitHint,
  productUnitsInPack,
} from './pharmacyProductMeta';

/** Продажа поштучно из упаковки: остаток на складе в упаковках, в чеке — штуки. */
export function resolvePharmacyPackSale(product) {
  if (!productSellByUnitHint(product)) return null;
  const unitsInPack = productUnitsInPack(product);
  if (!unitsInPack || unitsInPack <= 1) return null;

  const packUnitPrice = Number(product.sellingPrice ?? 0);
  const stockPacks = Number(product.stockQuantity ?? 0);

  return {
    unitsInPack,
    packUnitPrice,
    pieceUnitPrice: pharmacyPieceUnitPrice(packUnitPrice, unitsInPack),
    stockPieces: pharmacyStockPieces(stockPacks, unitsInPack),
  };
}

export function pharmacyPieceUnitPrice(packPrice, unitsInPack) {
  const pack = Number(packPrice);
  const units = Number(unitsInPack);
  if (!Number.isFinite(pack) || pack <= 0 || !Number.isFinite(units) || units <= 1) {
    return round2(pack);
  }
  return round2(pack / units);
}

export function pharmacyStockPieces(stockPacks, unitsInPack) {
  const packs = Number(stockPacks);
  const units = Number(unitsInPack);
  if (!Number.isFinite(packs) || packs <= 0 || !Number.isFinite(units) || units <= 1) {
    return Math.max(0, Math.floor(packs));
  }
  return Math.floor(packs * units);
}

export function applyPharmacyPackSaleToCartProduct(product) {
  const mode = resolvePharmacyPackSale(product);
  if (!mode) {
    return {
      ...product,
      pharmacySellByPiece: false,
      unitsInPack: null,
      packUnitPrice: null,
    };
  }

  return {
    ...product,
    sellingPrice: mode.pieceUnitPrice,
    stockQuantity: mode.stockPieces,
    pharmacySellByPiece: true,
    unitsInPack: mode.unitsInPack,
    packUnitPrice: mode.packUnitPrice,
  };
}

/** Позиция для API: количество в упаковках, цена за упаковку. */
export function pharmacyCheckoutLineFromCartItem(item) {
  const fromLine = Number(item?.unitsInPack);
  const unitsInPack = fromLine > 1 ? fromLine : productUnitsInPack(item);
  if (!unitsInPack || unitsInPack <= 1) {
    return null;
  }

  // Явный режим «по штукам» или цена в корзине уже за штуку (packUnitPrice задан).
  const sellByPiece = item.pharmacySellByPiece === true || item.packUnitPrice != null;
  if (!sellByPiece) {
    return null;
  }

  const piecePrice = Number(item.unitPrice);
  const packUnitPrice = item.packUnitPrice != null
    ? round2(item.packUnitPrice)
    : round2(piecePrice * unitsInPack);
  const packQty = roundQty(Number(item.quantity) / unitsInPack);

  if (!Number.isFinite(packQty) || packQty <= 0) {
    return null;
  }

  return {
    quantity: packQty,
    unitPrice: packUnitPrice,
  };
}
