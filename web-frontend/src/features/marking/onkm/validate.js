import { markingValidationApi } from './api';
import { buildMarkingValidationProducts } from './buildProducts';
import { MARKING_VALIDATION_STATUS } from './status';

export { MARKING_VALIDATION_STATUS };

/** Чек → backend → `validation-onkm`. Без маркированных строк — NOT_REQUIRED. */
export async function validateFiscalMarking({ cashRegisterId, cartItems, refund = false }) {
  const products = buildMarkingValidationProducts(cartItems);
  if (products.length === 0) {
    return { status: MARKING_VALIDATION_STATUS.NOT_REQUIRED, code: null, message: null, messageUz: null };
  }
  const { data } = await markingValidationApi.validate({ cashRegisterId, refund, products });
  return data;
}
