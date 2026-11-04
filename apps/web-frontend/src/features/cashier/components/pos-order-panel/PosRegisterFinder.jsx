import { forwardRef, useEffect, useRef } from 'react';
import { Barcode, ScanBarcode, UserPlus, X } from 'lucide-react';
import PosCatalogQuickFilters from '../pos-catalog/PosCatalogQuickFilters';
import PosCatalogProductBrowse from '../pos-catalog/PosCatalogProductBrowse';
import { ALL_CATEGORY_ID } from '../../hooks/usePosCatalogPanel';

/**
 * Register-pane finder: order header strip + scan search + quick filters + product picker.
 */
const PosRegisterFinder = forwardRef(function PosRegisterFinder(
  {
    t,
    checkNo,
    customerName,
    onOpenCustomerCard,
    search,
    onSearchChange,
    onSearchEnter,
    scanDisabled = false,
    categories,
    categoriesLoading,
    selectedCategoryId,
    searchActive,
    onSelectQuickFilter,
    pickerOpen,
    onClosePicker,
    products,
    productsLoading,
    productsError,
    productsLoadingMore,
    productsHasMore,
    onLoadMoreProducts,
    onAddProduct,
    viewMode = 'list',
  },
  searchInputRef
) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClosePicker?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pickerOpen, onClosePicker]);

  useEffect(() => {
    if (!pickerOpen) return;
    bodyRef.current?.scrollTo?.(0, 0);
  }, [pickerOpen, selectedCategoryId, search]);

  const handleCatalogScroll = () => {
    const el = bodyRef.current;
    if (!el || productsLoading || productsLoadingMore || !productsHasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 96) {
      onLoadMoreProducts?.();
    }
  };

  const clientLabel = customerName
    ? t('pos.orderClientNamed', { name: customerName })
    : t('pos.orderClientRetail');

  return (
    <div className="pos-register-finder">
      <div className="pos-register-finder__top">
        <div className="pos-register-finder__order-meta">
          <span className="pos-register-finder__check-badge">
            {t('pos.checkBadge', { no: checkNo || '————' })}
          </span>
          <div className="pos-register-finder__order-titles">
            <h2 className="pos-register-finder__title">{t('pos.currentOrder')}</h2>
            <p className="pos-register-finder__client">{clientLabel}</p>
          </div>
        </div>

        <div className="pos-register-finder__tools">
          <div className="pos-register-finder__search">
            <ScanBarcode size={18} className="pos-register-finder__search-icon" aria-hidden />
            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSearchEnter?.();
                }
              }}
              disabled={scanDisabled}
              placeholder={t('pos.scanPlaceholder')}
              autoComplete="off"
              className="pos-register-finder__search-input"
            />
            <span className="pos-register-finder__f2" title={t('pos.searchHotkeyF2')}>
              <Barcode size={12} aria-hidden />
              {t('pos.searchHotkeyF2')}
            </span>
          </div>
          <button
            type="button"
            className="pos-register-finder__card-btn"
            onClick={onOpenCustomerCard}
          >
            <UserPlus size={16} strokeWidth={2.25} aria-hidden />
            {t('pos.customerCard')}
          </button>
        </div>
      </div>

      <PosCatalogQuickFilters
        t={t}
        categories={categories}
        categoriesLoading={categoriesLoading}
        selectedCategoryId={selectedCategoryId}
        searchActive={searchActive}
        onSelect={onSelectQuickFilter}
        activeId={
          pickerOpen
            ? searchActive
              ? null
              : selectedCategoryId ?? ALL_CATEGORY_ID
            : null
        }
      />

      {pickerOpen ? (
        <div className="pos-register-finder__picker">
          <div className="pos-register-finder__picker-head">
            <span className="pos-register-finder__picker-title">
              {searchActive
                ? t('pos.searchProducts')
                : selectedCategoryId === ALL_CATEGORY_ID
                  ? t('pos.allProducts')
                  : categories?.find((c) => c.id === selectedCategoryId)?.name || t('pos.pickCategory')}
            </span>
            <button
              type="button"
              className="pos-register-finder__picker-close"
              onClick={onClosePicker}
            >
              <X size={16} aria-hidden />
              {t('pos.backToCheck')}
            </button>
          </div>
          <div
            ref={bodyRef}
            className="pos-register-finder__picker-body"
            onScroll={handleCatalogScroll}
          >
            <PosCatalogProductBrowse
              t={t}
              searchActive={searchActive}
              products={products}
              productsLoading={productsLoading}
              productsError={productsError}
              productsLoadingMore={productsLoadingMore}
              productsHasMore={productsHasMore}
              viewMode={viewMode}
              onAddProduct={onAddProduct}
              scrollParentRef={bodyRef}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default PosRegisterFinder;
