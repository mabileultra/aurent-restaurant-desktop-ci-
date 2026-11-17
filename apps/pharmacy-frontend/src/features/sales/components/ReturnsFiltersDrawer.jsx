// src/components/reports/ReturnsFiltersDrawer.jsx
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseSelect } from '../../../components/ui';

const inputCls = 'ui-input';

export default function ReturnsFiltersDrawer({ open, onClose, filters, onChange, onApply, onReset, stores }) {
  const { t } = useTranslation();
  if (!open) return null;

  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="fixed inset-0 bg-ink/45" aria-label="Close" onClick={onClose} />
      <aside className="relative flex w-full max-w-md flex-col border-l border-line bg-surface shadow-modal animate-[slideIn_0.2s_ease-out]">
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{t('returnsModule.filters.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="ui-icon-btn"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <BaseSelect
              label={t('returnsModule.filters.store')}
              value={filters.storeId}
              onChange={(e) => set('storeId', e.target.value)}
              placeholder={t('products.filters.any')}
              options={[
                { value: '', label: t('products.filters.any') },
                ...stores.map((s) => ({ value: String(s.id), label: s.name })),
              ]}
            />
            <p className="mt-1 text-xs text-ink-muted">{t('returnsModule.filters.storeHint')}</p>
          </div>
          <div>
            <label className="ui-label mb-1">{t('returnsModule.filters.cashierName')}</label>
            <input className={inputCls} value={filters.cashierName} onChange={(e) => set('cashierName', e.target.value)} />
          </div>
          <div>
            <label className="ui-label mb-1">{t('returnsModule.filters.date')}</label>
            <div className="grid grid-cols-2 gap-2 rounded-input border border-line bg-canvas p-3">
              <div>
                <span className="mb-1 block text-xs text-ink-muted">{t('salesLedger.filters.from')}</span>
                <input type="date" className={inputCls} value={filters.dateFrom} onChange={(e) => set('dateFrom', e.target.value)} />
              </div>
              <div>
                <span className="mb-1 block text-xs text-ink-muted">{t('salesLedger.filters.to')}</span>
                <input type="date" className={inputCls} value={filters.dateTo} onChange={(e) => set('dateTo', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 border-t border-line px-5 py-3.5">
          <button
            type="button"
            onClick={onReset}
            className="ui-btn-secondary flex-1"
          >
            {t('products.filters.reset')}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="ui-btn-primary flex-1"
          >
            {t('common.apply')}
          </button>
        </div>
      </aside>
    </div>
  );
}
