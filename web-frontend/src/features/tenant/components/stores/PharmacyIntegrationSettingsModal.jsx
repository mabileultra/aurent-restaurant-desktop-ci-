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

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div
        className="pharm-int-settings relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        role="dialog"
        aria-labelledby="pharm-int-settings-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div>
            <h2 id="pharm-int-settings-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              {pharmacyStore
                ? p.t('stores.pharmacyIntegration.title')
                : p.t('stores.pharmacyIntegration.titleRetail')}
            </h2>
            <p className="text-sm text-slate-500">{store.name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {p.isLoading ? (
              <p className="text-sm text-slate-500">{p.t('common.loading')}</p>
            ) : (
              <>
                <p className="pharm-int-settings__lead">
                  {pharmacyStore
                    ? p.t('stores.pharmacyIntegration.leadPharmacy')
                    : p.t('stores.pharmacyIntegration.leadRetail')}
                </p>

                <section className="pharm-int-settings__section">
                  <h3 className="pharm-int-settings__section-title">{p.t('stores.pharmacyIntegration.aslTitle')}</h3>
                  <label className="pharm-int-settings__check">
                    <input
                      type="checkbox"
                      checked={p.form.aslEnabled}
                      onChange={(e) => p.updateField('aslEnabled', e.target.checked)}
                    />
                    <span>{p.t('stores.pharmacyIntegration.aslEnabled')}</span>
                  </label>
                  <label className="pharm-int-settings__label">{p.t('stores.pharmacyIntegration.aslBaseUrl')}</label>
                  <input
                    className="pharm-int-settings__input"
                    value={p.form.aslApiBaseUrl}
                    onChange={(e) => p.updateField('aslApiBaseUrl', e.target.value)}
                    placeholder="https://xtrace.aslbelgisi.uz"
                  />
                  <label className="pharm-int-settings__label">{p.t('stores.pharmacyIntegration.aslApiKey')}</label>
                  <input
                    type="password"
                    className="pharm-int-settings__input"
                    value={p.form.aslApiKey}
                    onChange={(e) => p.updateField('aslApiKey', e.target.value)}
                    placeholder={p.hasAslApiKey ? p.maskedKey : p.t('stores.pharmacyIntegration.aslApiKeyPh')}
                    autoComplete="new-password"
                  />
                  {p.hasAslApiKey && (
                    <p className="pharm-int-settings__hint">{p.t('stores.pharmacyIntegration.aslKeySaved', { mask: p.maskedKey })}</p>
                  )}
                </section>

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

          <div className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
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
}
