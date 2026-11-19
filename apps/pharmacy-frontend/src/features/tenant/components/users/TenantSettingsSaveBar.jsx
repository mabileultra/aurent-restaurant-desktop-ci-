import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { useTenantDisplayStore } from '../../../../store/tenantDisplayStore';

export default function TenantSettingsSaveBar() {
  const { t } = useTranslation();
  const isDirty = useTenantDisplayStore((s) => s.isDirty);
  const isSaving = useTenantDisplayStore((s) => s.isSaving);
  const isLoading = useTenantDisplayStore((s) => s.isLoading);
  const saveToServer = useTenantDisplayStore((s) => s.saveToServer);
  const discardDraft = useTenantDisplayStore((s) => s.discardDraft);

  const handleSave = async () => {
    try {
      await saveToServer();
      toast.success(t('tenantSettings.saved'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('tenantSettings.saveFailed'));
    }
  };

  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-line bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {isDirty ? (
          <button
            type="button"
            disabled={isSaving || isLoading}
            onClick={discardDraft}
            className="ui-btn ui-btn-secondary"
          >
            {t('tenantSettings.discard')}
          </button>
        ) : null}
        <button
          type="button"
          disabled={isSaving || isLoading || !isDirty}
          onClick={handleSave}
          className="ui-btn ui-btn-primary px-5"
        >
          <Save size={16} strokeWidth={1.75} aria-hidden />
          {isSaving ? t('tenantSettings.saving') : t('tenantSettings.save')}
        </button>
      </div>
      <p className="mt-2 text-right text-xs text-ink-muted">
        {t('tenantSettings.saveHint')}
      </p>
    </div>
  );
}
