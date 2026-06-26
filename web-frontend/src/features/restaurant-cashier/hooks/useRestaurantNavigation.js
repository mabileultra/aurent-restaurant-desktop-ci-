import { useCallback, useEffect } from 'react';
import { ALL_CATEGORY_ID } from '../../cashier/hooks/usePosCatalogPanel';
import { usePosShell } from '../../../contexts/PosShellContext';
import { useCashierCompactLayout } from '../../../hooks/useCashierCompactLayout';

export function useRestaurantNavigation({
  restaurantPane,
  setRestaurantPane,
  payOpen,
  setPayOpen,
  onClosePayment,
  searchActive,
  viewMode,
  handleViewModeChange,
  catalogBrowse,
  setCatalogBrowse,
  setSelectedCategoryId,
  setSearch,
}) {
  const { setShell } = usePosShell() ?? {};
  const layoutCompact = useCashierCompactLayout();

  useEffect(() => {
    if (payOpen) setRestaurantPane('tables');
  }, [payOpen, setRestaurantPane]);

  const handleGoToCatalog = useCallback(() => {
    onClosePayment?.();
    setRestaurantPane('catalog');
    setCatalogBrowse('categories');
    setSelectedCategoryId(ALL_CATEGORY_ID);
    setSearch('');
  }, [onClosePayment, setRestaurantPane, setCatalogBrowse, setSelectedCategoryId, setSearch]);

  const handleGoToTables = useCallback(() => {
    onClosePayment?.();
    setRestaurantPane('tables');
    setSearch('');
  }, [onClosePayment, setRestaurantPane, setSearch]);

  useEffect(() => {
    if (!setShell) return undefined;
    setShell({
      posPane: restaurantPane,
      layoutCompact,
      payOpen,
      catalogBrowse,
      onGoToCatalog: handleGoToCatalog,
      onGoToTables: handleGoToTables,
      onClosePayment,
      searchActive,
      viewMode,
      onViewModeChange: handleViewModeChange,
    });
    return () => setShell(null);
  }, [
    setShell,
    restaurantPane,
    catalogBrowse,
    handleGoToCatalog,
    handleGoToTables,
    onClosePayment,
    searchActive,
    viewMode,
    handleViewModeChange,
    layoutCompact,
    payOpen,
  ]);

  return { handleGoToCatalog, handleGoToTables };
}
