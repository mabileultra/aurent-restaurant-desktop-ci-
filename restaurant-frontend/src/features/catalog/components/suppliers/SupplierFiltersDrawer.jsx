import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../../components/ui';
import '../../styles/supplier-filters.css';

export default function SupplierFiltersDrawer({ open, onClose, filters, onChange, onApply, onReset }) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="rst-supplier-filters">
      <button type="button" className="rst-supplier-filters__backdrop" aria-label="Close" onClick={onClose} />
      <aside className="rst-supplier-filters__panel">
        <div className="rst-supplier-filters__head">
          <h2>{t('suppliersModule.filters.title')}</h2>
          <button type="button" className="rst-supplier-filters__close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="rst-supplier-filters__body">
          <label className="rst-supplier-filters__field">
            <span>{t('suppliersModule.filters.createdOn')}</span>
            <input
              type="date"
              value={filters.createdOn}
              onChange={(e) => onChange({ ...filters, createdOn: e.target.value })}
            />
          </label>
        </div>
        <div className="rst-supplier-filters__foot">
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
