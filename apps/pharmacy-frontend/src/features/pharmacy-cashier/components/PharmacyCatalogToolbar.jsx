import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PharmacyCatalogColumnMenu from './PharmacyCatalogColumnMenu';
import '../styles/pharmacy-catalog-toolbar.css';

/**
 * Тулбар над каталогом: обновление + авто + колонки (ТЗ §2 зона 3).
 */
export default function PharmacyCatalogToolbar({
  onRefresh,
  refreshing = false,
  autoRefresh = true,
  onAutoRefreshChange,
  columnVisibility,
  onColumnVisibilityChange,
}) {
  const { t } = useTranslation();

  return (
    <div className="pharmacy-catalog-toolbar" role="toolbar" aria-label={t('pharmacyCashier.catalogToolbar')}>
      <button
        type="button"
        className="pharmacy-catalog-toolbar__btn"
        disabled={refreshing}
        onClick={onRefresh}
        title={t('pharmacyCashier.catalogRefresh')}
      >
        <RefreshCw size={14} strokeWidth={2.25} className={refreshing ? 'is-spin' : ''} aria-hidden />
        <span>{t('pharmacyCashier.catalogRefresh')}</span>
      </button>
      <label className="pharmacy-catalog-toolbar__auto">
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(e) => onAutoRefreshChange?.(e.target.checked)}
        />
        <span>{t('pharmacyCashier.catalogAutoRefresh')}</span>
      </label>
      {columnVisibility && onColumnVisibilityChange ? (
        <PharmacyCatalogColumnMenu
          visibility={columnVisibility}
          onChange={onColumnVisibilityChange}
        />
      ) : null}
    </div>
  );
}
