import PosCatalogVirtualProducts from './PosCatalogVirtualProducts';

export default function PosCatalogProductBrowse({
  t,
  searchActive,
  products,
  productsLoading,
  productsError,
  productsLoadingMore,
  productsHasMore,
  viewMode,
  onAddProduct,
  scrollParentRef,
}) {
  if (productsLoading) {
    return <p className="pos-catalog-panel__empty">{t('common.loading')}</p>;
  }

  if (productsError) {
    return <p className="pos-catalog-panel__empty">{t('offline.catalogLoadFailed')}</p>;
  }

  if (products.length === 0) {
    return <p className="pos-catalog-panel__empty">{t('pos.noProductsInCategory')}</p>;
  }

  return (
    <>
      {searchActive ? (
        <p className="pos-catalog-panel__hint">{t('pos.searchAllCategories')}</p>
      ) : null}
      <PosCatalogVirtualProducts
        products={products}
        viewMode={viewMode}
        t={t}
        onAddProduct={onAddProduct}
        scrollParentRef={scrollParentRef}
      />
      {productsLoadingMore ? (
        <p className="pos-catalog-panel__load-more" role="status">
          {t('pos.loadingMoreProducts')}
        </p>
      ) : null}
      {!productsLoadingMore && productsHasMore && products.length > 0 ? (
        <p className="pos-catalog-panel__load-more-hint">{t('pos.scrollForMoreProducts')}</p>
      ) : null}
    </>
  );
}
