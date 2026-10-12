import { markingValidationApi } from '../../../../api/markingValidation.api';
import { buildMarkingValidationProducts } from './buildMarkingValidationProducts';

export const MARKING_VALIDATION_STATUS = Object.freeze({
  VALID: 'VALID',
  REJECTED: 'REJECTED',
  UNAVAILABLE: 'UNAVAILABLE',
  NOT_REQUIRED: 'NOT_REQUIRED',
});

/** Проверка КМ чека через backend → `validation-onkm`. Без маркированных строк — NOT_REQUIRED. */
export async function validateFiscalMarking({ cashRegisterId, cartItems, refund = false }) {
  const products = buildMarkingValidationProducts(cartItems);
  if (products.length === 0) {
    return { status: MARKING_VALIDATION_STATUS.NOT_REQUIRED, code: null, message: null, messageUz: null };
  }
  const { data } = await markingValidationApi.validate({ cashRegisterId, refund, products });
  return data;
}
