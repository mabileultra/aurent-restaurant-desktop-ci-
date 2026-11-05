import { lookupTasnifIdentity } from '../../marking/lookupProductByMarkingGtin';
import { getReturnableLines } from '../../../components/sale-return/SaleReturnLinesEditor';
import { MARKING_VALIDATION_STATUS } from '../../marking/onkm/status';
import { validateFiscalMarking } from '../../marking/onkm/validate';

function digits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function findReceiptLine(sale, identity) {
  const lines = getReturnableLines(sale);
  const ikpu = digits(identity?.ikpu);
  if (ikpu.length >= 8) {
    const byIkpu = lines.find((line) => digits(line.ikpu) === ikpu);
    if (byIkpu) return byIkpu;
  }
  const name = String(identity?.name || '').trim().toLowerCase();
  if (name.length < 4) return null;
  const hits = lines.filter((line) => {
    const lineName = String(line.productName || '').trim().toLowerCase();
    return lineName && (lineName === name || lineName.includes(name) || name.includes(lineName));
  });
  return hits.length === 1 ? hits[0] : null;
}

function isForeign(result) {
  const code = String(result?.code || '');
  const message = String(result?.message || '');
  return code === '1002' || /принадлеж/i.test(message);
}

/**
 * Возврат: ИНН фирмы и Terminal ID кассы, флаг refund.
 * ours — код нашей фирмы и есть в чеке. foreign — чужая организация.
 * unconfirmed — владельца проверить нельзя, код не принимаем.
 */
export async function checkPharmacyReturnMark({ cashRegisterId, mark, sale }) {
  if (!cashRegisterId || !mark) {
    return { status: 'unconfirmed' };
  }
  let identity = null;
  try {
    identity = await lookupTasnifIdentity(mark);
  } catch {
    identity = null;
  }
  const ikpu = digits(identity?.ikpu);
  if (ikpu.length < 8) {
    return { status: 'unconfirmed' };
  }

  let result;
  try {
    result = await validateFiscalMarking({
      cashRegisterId,
      refund: true,
      cartItems: [{
        ikpu,
        packageCode: identity?.packageCode || null,
        quantity: 1,
        productMarks: [mark],
      }],
    });
  } catch (err) {
    return { status: 'unconfirmed', message: err?.message || null };
  }

  if (!result || result.status === MARKING_VALIDATION_STATUS.NOT_REQUIRED) {
    return { status: 'unconfirmed', message: result?.message || null };
  }
  if (result.status === MARKING_VALIDATION_STATUS.UNAVAILABLE) {
    return { status: 'unconfirmed', message: result.message || null };
  }
  if (result.status === MARKING_VALIDATION_STATUS.REJECTED) {
    return {
      status: isForeign(result) ? 'foreign' : 'rejected',
      message: result.message || null,
    };
  }
  if (result.status !== MARKING_VALIDATION_STATUS.VALID) {
    return { status: 'unconfirmed', message: result.message || null };
  }

  const line = findReceiptLine(sale, identity);
  if (!line) {
    return { status: 'not-on-receipt', name: identity?.name || null };
  }
  return { status: 'ours', line, name: line.productName || identity?.name || null };
}
