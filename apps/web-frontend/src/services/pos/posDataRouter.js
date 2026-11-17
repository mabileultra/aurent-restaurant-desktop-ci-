/**
 * Единый роутер POS: все операции кассы идут через этот модуль (API или SQLite).
 */
import { resolvePosRoute } from './posRouteResolver';
export { resolvePosRoute };

export { routeFor } from './posRouterShared';

export {
  getPosCatalogMode,
  posFetchCategories,
  posFetchProductsPage,
  posProductsNextPageParam,
  posFetchProductByBarcode,
} from './posCatalogRouter';

export { posOpenShift } from './posShiftOpenRouter';

export { posFetchCurrentShift, posCloseShift, posXReport } from './posShiftRouter';

export { posCreateSale, posFetchMySales } from './posSaleRouter';
