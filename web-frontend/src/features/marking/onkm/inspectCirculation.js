import { MARKING_VALIDATION_STATUS } from './status';
import { validateFiscalMarking } from './validate';

const WITHDRAWN_CODES = new Set(['1016', '2070']);

/**
 * Скан: в обороте / выведена.
 * Без кассы или без КМ — skipped (чековая проверка остаётся).
 */
export async function inspectMarkCirculation({ cashRegisterId, product, mark }) {
  if (!cashRegisterId || !mark) {
    return { status: 'skipped' };
  }
  const ikpu = String(product?.ikpu || product?.mxik || '').replace(/\D/g, '');
  if (!ikpu) {
    return { status: 'skipped' };
  }
  let result;
  try {
    result = await validateFiscalMarking({
      cashRegisterId,
      refund: false,
      cartItems: [{
        ...product,
        quantity: 1,
        productMarks: [mark],
      }],
    });
  } catch (err) {
    return {
      status: 'unavailable',
      code: err?.code || null,
      message: err?.message || null,
    };
  }
  if (result?.status === MARKING_VALIDATION_STATUS.VALID) {
    return { status: 'in-circulation', result };
  }
  if (!result || result.status === MARKING_VALIDATION_STATUS.NOT_REQUIRED) {
    return { status: 'skipped', result };
  }
  if (result.status === MARKING_VALIDATION_STATUS.REJECTED) {
    return {
      status: 'not-in-circulation',
      withdrawn: WITHDRAWN_CODES.has(String(result.code || '')),
      code: result.code || null,
      message: result.message || null,
    };
  }
  return {
    status: 'unavailable',
    code: result.code || null,
    message: result.message || null,
  };
}
