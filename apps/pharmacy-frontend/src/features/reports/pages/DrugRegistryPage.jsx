import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/ui';
import { useDrugRegistryPage } from '../hooks/useDrugRegistryPage';

/** Government drug registry upload (ZIP/Excel from captcha-gated site). */
export default function DrugRegistryPage() {
  const { t } = useTranslation();
  const r = useDrugRegistryPage(t);

  return (
    <div className="space-y-6">
      <div>
        <PageHeader title={t('drugRegistry.title')} subtitle={t('drugRegistry.subtitle')} />
        {r.latest ? (
          <p className="ui-tabular mt-1.5 text-xs text-ink-muted">
            {t('drugRegistry.latest', {
              file: r.latest.fileName || '—',
              rows: r.latest.rowCount ?? 0,
            })}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-ink-muted">{t('drugRegistry.empty')}</p>
        )}
      </div>

      <label className="ui-btn ui-btn-primary inline-flex cursor-pointer">
        {r.uploading ? t('common.loading') : t('drugRegistry.upload')}
        <input
          type="file"
          accept=".xlsx,.xls,.zip"
          className="hidden"
          disabled={r.uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            r.upload(file);
          }}
        />
      </label>

      <p className="max-w-xl text-sm text-ink-muted">
        {t('drugRegistry.hint')}
      </p>
    </div>
  );
}
