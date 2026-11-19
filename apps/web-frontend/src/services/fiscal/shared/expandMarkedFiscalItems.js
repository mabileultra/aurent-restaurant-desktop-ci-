import { lineDiscountAmount } from '../../../store/cartStore';
import { round2 } from '../../../utils/taxAmounts';

/** Каждая отсканированная маркировка уходит в фискал отдельной единицей упаковки. */
export function expandMarkedFiscalItems(items) {
  return (items || []).flatMap((line) => {
    const marks = Array.isArray(line?.productMarks) && line.productMarks.some(Boolean)
      ? line.productMarks.filter((mark) => String(mark || '').trim())
      : [line?.productMark || line?.markCode || line?.productLabel].filter((mark) => String(mark || '').trim());
    if (marks.length === 0) return [line];

    const discount = lineDiscountAmount(line);
    const share = marks.length > 0 ? round2(discount / marks.length) : 0;
    const units = line?.sellAsBlock === true && Number(line?.unitsInPack) > 1
      ? Number(line.unitsInPack)
      : 1;
    const piecePrice = Number(line.unitPrice) || 0;
    // Склад: qty=N шт × цена шт. ОФД: count=1 блок × цена блока.
    const fiscalUnitPrice = units > 1 ? round2(piecePrice * units) : piecePrice;
    return marks.map((mark) => ({
      ...line,
      quantity: 1,
      unitPrice: fiscalUnitPrice,
      discount: share,
      discountPercent: 0,
      productMark: mark,
      markCode: mark,
      productLabel: mark,
      // Иначе validation-onkm шлёт на каждую пачку все КМ строки (аптека: 3 марки → amount 1).
      productMarks: [mark],
    }));
  });
}
