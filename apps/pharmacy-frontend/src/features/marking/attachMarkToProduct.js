import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

/** Полный КМ со сканера в карточку / строку чека. Криптохвост не режем до фискала. */
export function attachMarkToProduct(product, rawMark) {
  const mark = preserveMarkingCodeForFiscal(rawMark);
  if (!product || !mark) return product;
  return {
    ...product,
    productMark: mark,
    markCode: mark,
    markedProduct: true,
    productMarks: [mark],
  };
}

/** КМ строки: productMarks или одиночный productMark. */
export function lineMarkingCodes(line) {
  if (Array.isArray(line?.productMarks) && line.productMarks.some(Boolean)) {
    return line.productMarks.map((mark) => String(mark || '').trim()).filter(Boolean);
  }
  const single = line?.productMark || line?.markCode || line?.productLabel;
  return single ? [String(single).trim()] : [];
}
