import { toOfdMarkingLabel } from '../../shared/ofdMarkingLabel';
import { resolveLinePackageCode } from '../../shared/resolveLinePackageCode';

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

function lineRawMarks(line) {
  const raw = Array.isArray(line.productMarks) && line.productMarks.length > 0
    ? line.productMarks
    : [line.productMark || line.markCode || line.productLabel];
  return raw.map((code) => String(code ?? '').replace(/^\uFEFF/, '').trim()).filter(Boolean);
}

/**
 * Строки корзины с КМ → products для `validation-onkm`.
 * kmIds — КИ без криптохвоста (как Labels в чеке), fullKmIds — полный DataMatrix.
 */
export function buildMarkingValidationProducts(cartItems = []) {
  const products = [];
  for (const line of cartItems) {
    const fullKmIds = [];
    const kmIds = [];
    for (const raw of lineRawMarks(line)) {
      const km = toOfdMarkingLabel(raw);
      if (!km || kmIds.includes(km)) continue;
      kmIds.push(km);
      fullKmIds.push(raw);
    }
    if (kmIds.length === 0) continue;

    const commitentTin = digitsOnly(line.commissionTin || line.commitentTin);
    products.push({
      productCode: digitsOnly(line.ikpu),
      packageCode: digitsOnly(resolveLinePackageCode(line)) || null,
      amount: Number(line.quantity) || 0,
      kmIds,
      fullKmIds,
      commitentTin: commitentTin.length === 9 || commitentTin.length === 14 ? commitentTin : null,
    });
  }
  return products;
}
