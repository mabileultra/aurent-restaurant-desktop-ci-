// src/components/cash-registers/CashTransferFiltersDrawer.jsx
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const inputCls = 'ui-input';

export default function CashTransferFiltersDrawer({ open, onClose, filters, onChange, onApply, onReset }) {
  const { t } = useTranslation();
  if (!open) return null;

  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="fixed inset-0 bg-ink/45" aria-label="Close" onClick={onClose} />
      <aside className="relative flex w-full max-w-md flex-col border-l border-line bg-surface shadow-modal animate-[slideIn_0.2s_ease-out]">
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{t('cashRegisters.filterPanelTitle')}</h2>
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
            <label className="ui-label mb-1">
              {t('cashRegisters.transferFilterRegister')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              className={`${inputCls} ui-tabular`}
              value={filters.registerNumber}
              onChange={(e) => set('registerNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="1"
            />
          </div>
          <div>
            <label className="ui-label mb-2">
              {t('cashRegisters.transferFilterClosedRange')}
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="mb-1 block text-xs text-ink-muted">
                  {t('cashRegisters.transferFilterClosedFrom')}
                </span>
                <input
                  type="date"
                  className={inputCls}
                  value={filters.closedFrom}
                  onChange={(e) => set('closedFrom', e.target.value)}
                />
              </div>
              <div>
                <span className="mb-1 block text-xs text-ink-muted">
                  {t('cashRegisters.transferFilterClosedTo')}
                </span>
                <input
                  type="date"
                  className={inputCls}
                  value={filters.closedTo}
                  onChange={(e) => set('closedTo', e.target.value)}
                />
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
