/** Re-export POS catalog через единый posDataRouter. */
export {
  getPosCatalogMode,
  posFetchCategories as fetchPosCategories,
  posFetchProductsPage as fetchPosProductsPage,
  posProductsNextPageParam as getPosProductsNextPageParam,
} from '../pos/posDataRouter';
