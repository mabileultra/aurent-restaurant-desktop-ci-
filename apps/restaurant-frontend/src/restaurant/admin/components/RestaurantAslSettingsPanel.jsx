import { BaseButton, BaseInput } from '../../../components/ui';
import { useRestaurantAslSettings } from '../hooks/useRestaurantAslSettings';
import '../styles/integrations-admin.css';

export default function RestaurantAslSettingsPanel({ storeId, storeName, t }) {
  const p = useRestaurantAslSettings({ storeId, enabled: storeId != null });

  if (storeId == null) {
    return <div className="rst-notice">{t('rst.admin.selectStore')}</div>;
  }

  return (
    <section className="rst-int-panel">
      <header className="rst-int-panel__head">
        <div>
          <h2 className="rst-int-panel__title">{t('rst.integrations.aslTitle')}</h2>
          <p className="rst-int-panel__sub">
            {t('rst.integrations.aslLead', { name: storeName || `#${storeId}` })}
          </p>
        </div>
      </header>

      {p.isError ? (
        <div className="rst-notice">{t('rst.integrations.aslLoadFailed')}</div>
      ) : p.isLoading ? (
        <div className="rst-empty">{t('common.loading')}</div>
      ) : (
        <form className="rst-int-form" onSubmit={p.submit}>
          <label className="rst-admin-check">
            <input
              type="checkbox"
              checked={p.form.aslEnabled}
              onChange={(e) => p.updateField('aslEnabled', e.target.checked)}
            />
            <span>{t('stores.pharmacyIntegration.aslEnabled')}</span>
          </label>

          <BaseInput
            label={t('stores.pharmacyIntegration.aslBaseUrl')}
            value={p.form.aslApiBaseUrl}
            onChange={(e) => p.updateField('aslApiBaseUrl', e.target.value)}
            placeholder="https://xtrace.aslbelgisi.uz"
          />

          <BaseInput
            label={t('stores.pharmacyIntegration.aslApiKey')}
            type="password"
            value={p.form.aslApiKey}
            onChange={(e) => p.updateField('aslApiKey', e.target.value)}
            placeholder={
              p.hasAslApiKey
                ? p.maskedKey
                : t('stores.pharmacyIntegration.aslApiKeyPh')
            }
            autoComplete="new-password"
          />
          {p.hasAslApiKey ? (
            <p className="rst-int-form__hint">
              {t('stores.pharmacyIntegration.aslKeySaved', { mask: p.maskedKey })}
            </p>
          ) : null}

          <p className="rst-int-form__hint">{t('rst.integrations.aslReceiptHint')}</p>

          <div className="rst-int-form__actions">
            <BaseButton type="submit" disabled={p.saving}>
              {p.saving ? t('common.saving') : t('common.save')}
            </BaseButton>
          </div>
        </form>
      )}
    </section>
  );
}
