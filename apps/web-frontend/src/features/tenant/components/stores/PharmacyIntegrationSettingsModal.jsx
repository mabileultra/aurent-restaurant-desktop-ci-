import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { BaseCheckbox } from '../../../../components/ui';
import { usePharmacyIntegrationSettings } from '../../hooks/usePharmacyIntegrationSettings';
import { storeIsPharmacy } from '../../utils/storeAslMarkingSupport';
import '../../../../styles/tenant/pharmacy-integration-settings-modal.css';

export default function PharmacyIntegrationSettingsModal({ open, store, onClose }) {
  const p = usePharmacyIntegrationSettings({ store, open, onSaved: onClose });
  const pharmacyStore = storeIsPharmacy(store?.businessType);

  if (!open || !store) return null;

  const handleSubmit = (e) => {
    p.submit(e);
  };

  const modalNode = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60 bg-aa-scrim" aria-label="Close" onClick={onClose} />
      <div
        className="pharm-int-settings relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-aa-lg border border-aa-line bg-aa-surface shadow-aa-modal"
        role="dialog"
        aria-labelledby="pharm-int-settings-title"
      >
        <div className="flex items-center justify-between border-b border-aa-line px-4 py-3 bg-aa-surface-sunken">
          <div>
            <h2 id="pharm-int-settings-title" className="text-lg font-semibold text-aa-ink">
              {p.t('stores.pharmacyIntegration.title')}
            </h2>
            <p className="text-sm text-aa-ink-muted">{store.name}</p>
          </div>
          <button type="button" onClick={onClose} className="aa-btn aa-btn--ghost aa-btn--icon text-aa-ink-muted hover:text-aa-ink cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 bg-aa-surface">
            {p.isLoading ? (
              <p className="text-sm text-aa-ink-muted">{p.t('common.loading')}</p>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-aa-ink-muted">
                  {p.t('stores.pharmacyIntegration.leadPharmacy')}
                </p>

                {pharmacyStore ? (
                  <section className="space-y-3 pt-3 border-t border-aa-line">
                    <h3 className="text-sm font-bold text-aa-ink">{p.t('stores.pharmacyIntegration.dmedTitle')}</h3>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-aa-ink">
                      <BaseCheckbox
                        checked={p.form.dmedEnabled}
                        onChange={(e) => p.updateField('dmedEnabled', e.target.checked)}
                        size={18}
                      />
                      <span>{p.t('stores.pharmacyIntegration.dmedEnabled')}</span>
                    </label>
                    <label className="block text-xs font-semibold text-aa-ink-muted">{p.t('stores.pharmacyIntegration.dmedExternalId')}</label>
                    <input
                      className="w-full aa-size-input-md border border-aa-line-strong rounded-aa-md bg-aa-surface text-aa-ink focus:outline-hidden focus:border-aa-brand focus:ring-1 focus:ring-aa-brand"
                      value={p.form.dmedExternalId}
                      onChange={(e) => p.updateField('dmedExternalId', e.target.value)}
                      placeholder={p.t('stores.pharmacyIntegration.dmedExternalIdPh')}
                    />
                    <p className="text-xs text-aa-ink-subtle">{p.t('stores.pharmacyIntegration.dmedHint')}</p>
                  </section>
                ) : null}
              </>
            )}
          </div>

          <div className="flex gap-2 border-t border-aa-line p-4 justify-end bg-aa-surface">
            <button type="button" onClick={onClose} className="aa-btn aa-btn--secondary aa-size-md">
              {p.t('common.cancel')}
            </button>
            <button type="submit" disabled={p.isLoading || p.saving} className="aa-btn aa-btn--primary aa-size-md">
              {p.t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalNode, document.body);
  }
  return modalNode;
}
