import { productAttr } from './pharmacyProductMeta';

/** Референтная / предельная цена (реестр или атрибут). */
export function productReferencePrice(productOrLine) {
  const direct = Number(productOrLine?.referencePrice);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const raw = productAttr(
    productOrLine,
    'reference_price',
    'referencePrice',
    'limit_price',
    'limitPrice',
    'референтная_цена',
  );
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Балл карточки товара. */
export function productScore(productOrLine) {
  const direct = Number(productOrLine?.score);
  if (Number.isFinite(direct)) return direct;
  const raw = productAttr(productOrLine, 'score', 'балл', 'points', 'ball');
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
