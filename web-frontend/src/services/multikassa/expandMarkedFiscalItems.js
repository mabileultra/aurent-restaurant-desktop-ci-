import { lineDiscountAmount } from '../../store/cartStore';
import { round2 } from '../../utils/taxAmounts';

/** Каждая отсканированная маркировка уходит в фискал отдельной штукой. Строки без кодов не дробятся. */
export function expandMarkedFiscalItems(items) {
  return (items || []).flatMap((line) => {
    const marks = Array.isArray(line?.productMarks)
      ? line.productMarks.filter((mark) => String(mark || '').trim())
      : [];
    if (marks.length === 0) return [line];

    const discount = lineDiscountAmount(line);
    const share = marks.length > 0 ? round2(discount / marks.length) : 0;
    return marks.map((mark) => ({
      ...line,
      quantity: 1,
      discount: share,
      discountPercent: 0,
      productMark: mark,
      markCode: mark,
      productLabel: mark,
    }));
  });
}
