import { PageSearchField } from '../../../../components/ui';
import ReportStoreSelect from '../ReportStoreSelect';
import './stock-balances-filters.css';

/** Pharmacy balances filters — no grocery categories. */
export default function StockBalancesFilters({
  t,
  search,
  onSearchChange,
  storeId,
  stores,
  onStoreChange,
  onlyWithStock,
  onOnlyWithStockChange,
}) {
  const storeHint =
    storeId === '' || storeId == null
      ? t('stockReports.balancesFilterAllStoresHint')
      : t('stockReports.balancesFilterStoreHint');

  return (
    <section className="stock-balances-filters" aria-label={t('stockReports.balancesFilters')}>
      <div className="stock-balances-filters__grid stock-balances-filters__grid--pharmacy">
        <div className="stock-balances-filters__field">
          <span className="stock-balances-filters__label">{t('stockReports.filterSearch')}</span>
          <PageSearchField
            value={search}
            onChange={onSearchChange}
            placeholder={t('stockModule.searchPh')}
            className="w-full"
          />
        </div>
        <div className="stock-balances-filters__field">
          <span className="stock-balances-filters__label">{t('stockReports.colStore')}</span>
          <ReportStoreSelect
            stores={stores}
            value={storeId}
            onChange={onStoreChange}
            className="w-full min-w-0"
          />
        </div>
      </div>
      <div className="stock-balances-filters__foot">
        <label className="stock-balances-filters__check">
          <input
            type="checkbox"
            checked={onlyWithStock}
            onChange={(e) => onOnlyWithStockChange(e.target.checked)}
          />
          {t('stockReports.onlyWithStock')}
        </label>
        <p className="stock-balances-filters__hint">{storeHint}</p>
      </div>
    </section>
  );
}
