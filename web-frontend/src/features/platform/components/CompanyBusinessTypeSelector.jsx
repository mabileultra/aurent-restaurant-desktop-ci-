import { Info } from 'lucide-react';

export default function CompanyBusinessTypeSelector({
  t,
  form,
  businessTypes = [],
  onToggleBusinessType,
  onSetDefaultBusinessType,
}) {
  const defaultTypeCode = businessTypes.find((bt) => bt.id === form.defaultBusinessTypeId)?.code ?? '';
  const defaultTypeName = t(`productTemplates.businessTypes.${defaultTypeCode}`, {
    defaultValue: defaultTypeCode,
  });

  return (
    <div className="mb-1">
      <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {t('platform.field_businessTypes')} *
      </p>
      <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
        {businessTypes.map((bt) => {
          const checked = form.businessTypeIds.includes(bt.id);
          const isDefault = form.defaultBusinessTypeId === bt.id;
          const displayName = t(`productTemplates.businessTypes.${bt.code}`, { defaultValue: bt.name });
          return (
            <label
              key={bt.id}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 border transition-colors ${
                checked
                  ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800/80 dark:bg-emerald-950/20'
                  : 'border-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  checked={checked}
                  onChange={() => onToggleBusinessType(bt.id)}
                />
                <span className="font-medium">{displayName}</span>
                <span className="font-mono text-xs text-slate-400">({bt.code})</span>
              </span>
              {checked ? (
                <button
                  type="button"
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    isDefault
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : 'text-slate-500 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSetDefaultBusinessType(bt.id);
                  }}
                >
                  {isDefault ? `★ ${t('platform.businessTypeDefault')}` : t('platform.businessTypeMakeDefault')}
                </button>
              ) : null}
            </label>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-slate-500">{t('platform.field_businessTypesHint')}</p>
      {form.defaultBusinessTypeId ? (
        <div className="mt-2 flex items-start gap-2 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300">
          <Info size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{t('platform.businessTypeDefaultHint', { code: defaultTypeName })}</span>
        </div>
      ) : null}
    </div>
  );
}
