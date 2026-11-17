import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
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
    <div className="ui-modal-overlay z-[1000] !bg-transparent">
      <button type="button" className="fixed inset-0 bg-ink/45" aria-label="Close" onClick={onClose} />
      <div
        className="pharm-int-settings ui-modal-panel relative max-w-lg max-h-[90vh]"
        role="dialog"
        aria-labelledby="pharm-int-settings-title"
      >
        <div className="ui-modal-header">
          <div>
            <h2 id="pharm-int-settings-title" className="text-base font-semibold text-ink">
              {p.t('stores.pharmacyIntegration.title')}
            </h2>
            <p className="text-xs text-ink-muted">{store.name}</p>
          </div>
          <button type="button" onClick={onClose} className="ui-icon-btn" aria-label={p.t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="ui-modal-body flex-1 space-y-4 overflow-y-auto">
            {p.isLoading ? (
              <p className="text-sm text-ink-muted">{p.t('common.loading')}</p>
            ) : (
              <>
                <p className="pharm-int-settings__lead">
                  {p.t('stores.pharmacyIntegration.leadPharmacy')}
                </p>

                {pharmacyStore ? (
                  <section className="pharm-int-settings__section">
                    <h3 className="pharm-int-settings__section-title">{p.t('stores.pharmacyIntegration.dmedTitle')}</h3>
                    <label className="pharm-int-settings__check">
                      <input
                        type="checkbox"
                        checked={p.form.dmedEnabled}
                        onChange={(e) => p.updateField('dmedEnabled', e.target.checked)}
                      />
                      <span>{p.t('stores.pharmacyIntegration.dmedEnabled')}</span>
                    </label>
                    <label className="pharm-int-settings__label">{p.t('stores.pharmacyIntegration.dmedExternalId')}</label>
                    <input
                      className="pharm-int-settings__input"
                      value={p.form.dmedExternalId}
                      onChange={(e) => p.updateField('dmedExternalId', e.target.value)}
                      placeholder={p.t('stores.pharmacyIntegration.dmedExternalIdPh')}
                    />
                    <p className="pharm-int-settings__hint">{p.t('stores.pharmacyIntegration.dmedHint')}</p>
                  </section>
                ) : null}
              </>
            )}
          </div>

          <div className="ui-modal-footer">
            <button type="button" onClick={onClose} className="pharm-int-settings__btn pharm-int-settings__btn--ghost">
              {p.t('common.cancel')}
            </button>
            <button type="submit" disabled={p.isLoading || p.saving} className="pharm-int-settings__btn pharm-int-settings__btn--primary">
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
