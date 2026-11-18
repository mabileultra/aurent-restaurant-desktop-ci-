/**
 * Assembles props object for PosCatalog component
 */
export function buildPosCatalogProps(catalog, cartHandlers, { storeId, viewMode, handleViewModeChange }) {
  return {
    storeId,
    viewMode,
    handleViewModeChange,
    search: catalog.search,
    setSearch: catalog.setSearch,
    categories: catalog.categories,
    categoriesLoading: catalog.categoriesLoading,
    categoriesError: catalog.categoriesError,
    selectedCategoryId: catalog.selectedCategoryId,
    handleSelectCategory: catalog.handleSelectCategory,
    setSelectedCategoryId: catalog.setSelectedCategoryId,
    searchActive: catalog.searchActive,
    catalogBrowse: catalog.catalogBrowse,
    setCatalogBrowse: catalog.setCatalogBrowse,
    products: catalog.products,
    productsLoading: catalog.productsLoading,
    productsStale: catalog.productsStale,
    productsError: catalog.productsError,
    productsLoadingMore: catalog.productsLoadingMore,
    productsHasMore: catalog.productsHasMore,
    fetchMoreProducts: catalog.fetchMoreProducts,
    addProductToCart: (product) => {
      if (catalog.productsStale) return;
      cartHandlers.addProductToCart(product);
    },
    handleSearchEnter: cartHandlers.handleSearchEnter,
  };
}
