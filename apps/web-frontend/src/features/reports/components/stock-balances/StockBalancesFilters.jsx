import { BaseSelect, PageSearchField } from '../../../../components/ui';
import ReportStoreSelect from '../ReportStoreSelect';
import './stock-balances-filters.css';

export default function StockBalancesFilters({
  t,
  search,
  onSearchChange,
  storeId,
  stores,
  onStoreChange,
  categoryId,
  categories,
  onCategoryChange,
  onlyWithStock,
  onOnlyWithStockChange,
}) {
  const storeHint =
    storeId === '' || storeId == null
      ? t('stockReports.balancesFilterAllStoresHint')
      : t('stockReports.balancesFilterStoreHint');

  return (
    <section className="stock-balances-filters" aria-label={t('stockReports.balancesFilters')}>
      <div className="stock-balances-filters__grid">
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
        <div className="stock-balances-filters__field">
          <span className="stock-balances-filters__label">{t('stockReports.colCategory')}</span>
          <BaseSelect
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full min-w-0"
            placeholder={t('stockReports.allCategories')}
            options={[
              { value: '', label: t('stockReports.allCategories') },
              ...categories.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
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
