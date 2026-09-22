import { useTranslation } from 'react-i18next';
import StockProductsFiltersDrawer from './StockProductsFiltersDrawer';
import StockProductsRowMenu from './StockProductsRowMenu';
import StockAdjustModal from './StockAdjustModal';
import WarehouseReceiveModal from './WarehouseReceiveModal';

export default function StockProductsModals({
  manage,
  filtersOpen,
  onFiltersClose,
  filters,
  onFiltersChange,
  onFiltersReset,
  onFiltersApply,
  receiveOpen,
  onReceiveClose,
  preferredStoreId,
  onInvalidateCaches,
  stockProduct,
  onStockClose,
  receiveProduct,
  onReceiveProductClose,
  rowMenu,
  onRowMenuClose,
  onAdjust,
  onReceive,
}) {
  const { t } = useTranslation();

  return (
    <>
      <StockProductsFiltersDrawer
        open={filtersOpen}
        onClose={onFiltersClose}
        filters={filters}
        onChange={onFiltersChange}
        onReset={onFiltersReset}
        onApply={onFiltersApply}
      />

      <WarehouseReceiveModal
        open={receiveOpen}
        onClose={onReceiveClose}
        preferredStoreId={preferredStoreId}
        onSaved={onInvalidateCaches}
      />

      {stockProduct ? (
        <StockAdjustModal
          product={stockProduct}
          preferredStoreId={preferredStoreId}
          onClose={onStockClose}
          onSaved={() => {
            onInvalidateCaches();
            onStockClose();
          }}
        />
      ) : null}

      <WarehouseReceiveModal
        open={!!receiveProduct}
        onClose={onReceiveProductClose}
        initialProduct={receiveProduct}
        preferredStoreId={preferredStoreId}
        onSaved={onInvalidateCaches}
      />

      <StockProductsRowMenu
        menu={rowMenu}
        t={t}
        manage={manage}
        onClose={onRowMenuClose}
        onAdjust={onAdjust}
        onReceive={onReceive}
      />
    </>
  );
}
