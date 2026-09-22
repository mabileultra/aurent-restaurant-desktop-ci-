import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseSelect, BaseButton } from '../../../components/ui';
import '../styles/stock-products-filters.css';

export default function StockProductsFiltersDrawer({
  open,
  onClose,
  filters,
  onChange,
  onApply,
  onReset,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="rst-stock-filters">
      <button type="button" className="rst-stock-filters__backdrop" aria-label="Close" onClick={onClose} />
      <aside className="rst-stock-filters__panel">
        <div className="rst-stock-filters__head">
          <h2>{t('stockModule.filters.title')}</h2>
          <button type="button" onClick={onClose} className="rst-stock-filters__close">
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="rst-stock-filters__body">
          <label className="rst-stock-filters__field">
            <span>{t('stockModule.filters.barcode')}</span>
            <input
              value={filters.barcode}
              onChange={(e) => set('barcode', e.target.value)}
            />
          </label>
          <BaseSelect
            label={t('stockModule.filters.marked')}
            value={filters.markedProduct}
            onChange={(e) => set('markedProduct', e.target.value)}
            placeholder={t('stockModule.filters.markedAny')}
            options={[
              { value: '', label: t('stockModule.filters.markedAny') },
              { value: 'true', label: t('stockModule.filters.markedYes') },
              { value: 'false', label: t('stockModule.filters.markedNo') },
            ]}
          />
        </div>
        <div className="rst-stock-filters__foot">
          <BaseButton type="button" variant="secondary" onClick={onReset}>
            {t('products.filters.reset')}
          </BaseButton>
          <BaseButton type="button" onClick={onApply}>
            {t('common.apply')}
          </BaseButton>
        </div>
      </aside>
    </div>
  );
}
