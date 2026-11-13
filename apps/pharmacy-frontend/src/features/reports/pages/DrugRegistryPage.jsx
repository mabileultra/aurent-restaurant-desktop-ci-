import { useTranslation } from 'react-i18next';
import { useDrugRegistryPage } from '../hooks/useDrugRegistryPage';

/** Загрузка государственного реестра лекарств (ZIP/Excel с капчей на сайте). */
export default function DrugRegistryPage() {
  const { t } = useTranslation();
  const r = useDrugRegistryPage(t);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {t('drugRegistry.title')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('drugRegistry.subtitle')}
        </p>
        {r.latest ? (
          <p className="mt-1 text-xs text-slate-500">
            {t('drugRegistry.latest', {
              file: r.latest.fileName || '—',
              rows: r.latest.rowCount ?? 0,
            })}
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">{t('drugRegistry.empty')}</p>
        )}
      </div>

      <label className="admin-btn-primary inline-flex cursor-pointer px-4 py-2 text-sm">
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

      <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('drugRegistry.hint')}
      </p>
    </div>
  );
}
