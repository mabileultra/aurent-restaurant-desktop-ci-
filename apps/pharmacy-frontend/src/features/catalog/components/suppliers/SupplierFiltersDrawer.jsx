// src/components/suppliers/SupplierFiltersDrawer.jsx
import { X, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SupplierFiltersDrawer({ open, onClose, filters, onChange, onApply, onReset }) {
  const { t } = useTranslation();
  if (!open) return null;

  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="fixed inset-0 bg-ink/45" aria-label="Close" onClick={onClose} />
      <aside className="relative flex w-full max-w-md flex-col border-l border-line bg-surface shadow-modal animate-[slideIn_0.2s_ease-out]">
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{t('suppliersModule.filters.title')}</h2>
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
            <label className="ui-label mb-1.5">{t('suppliersModule.filters.createdOn')}</label>
            <div className="relative">
              <input
                type="date"
                className="ui-input pr-10"
                value={filters.createdOn}
                onChange={(e) => set('createdOn', e.target.value)}
              />
              <Calendar size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
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
