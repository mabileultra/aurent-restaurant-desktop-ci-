/**
 * Tasnif `validation-onkm`. Выносится целиком: эта папка + backend
 * `integrations/markingvalidation`. Фискальный провайдер только вызывает
 * `assertOnkmMarking`. Резка КИ (91/92/93) остаётся в `fiscal/shared/ofdMarkingLabel`.
 */
export { markingValidationApi } from './api';
export { MARKING_VALIDATION_STATUS } from './status';
export { buildMarkingValidationProducts } from './buildProducts';
export { validateFiscalMarking } from './validate';
export { assertOnkmMarking } from './assertBeforeSale';
export { inspectMarkCirculation } from './inspectCirculation';
