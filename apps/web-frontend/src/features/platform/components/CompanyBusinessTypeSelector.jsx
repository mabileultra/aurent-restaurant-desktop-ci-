import { Info } from 'lucide-react';
import { BaseCheckbox } from '../../../components/ui';

export default function CompanyBusinessTypeSelector({
  t,
  form,
  businessTypes = [],
  onToggleBusinessType,
  onSetDefaultBusinessType,
  error,
}) {
  const defaultTypeCode = businessTypes.find((bt) => bt.id === form.defaultBusinessTypeId)?.code ?? '';
  const defaultTypeName = t(`productTemplates.businessTypes.${defaultTypeCode}`, {
    defaultValue: defaultTypeCode,
  });

  return (
    <div className="mb-1">
      <p className="mb-2 text-sm font-semibold text-aa-ink">
        {t('platform.field_businessTypes')} *
      </p>
      <div className={`max-h-48 space-y-2 overflow-y-auto rounded-aa-md border p-3 bg-aa-surface-sunken ${
        error ? 'border-aa-danger' : 'border-aa-line'
      }`}>
        {businessTypes.map((bt) => {
          const checked = form.businessTypeIds.includes(bt.id);
          const isDefault = form.defaultBusinessTypeId === bt.id;
          const displayName = t(`productTemplates.businessTypes.${bt.code}`, { defaultValue: bt.name });
          return (
            <label
              key={bt.id}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-aa-md px-3 py-2 border transition-colors ${
                checked
                  ? 'border-aa-brand/40 bg-aa-brand-soft text-aa-ink'
                  : 'border-transparent hover:bg-aa-surface-hover text-aa-ink'
              }`}
            >
              <span className="flex items-center gap-2 text-sm text-aa-ink">
                <BaseCheckbox
                  checked={checked}
                  onChange={() => onToggleBusinessType(bt.id)}
                  size={18}
                />
                <span className="font-medium text-aa-ink">{displayName}</span>
                <span className="font-mono text-xs text-aa-ink-muted">({bt.code})</span>
              </span>
              {checked ? (
                <button
                  type="button"
                  className={`rounded-aa-sm px-2 py-0.5 text-xs font-semibold transition-colors cursor-pointer ${
                    isDefault
                      ? 'bg-aa-brand-soft text-aa-brand border border-aa-brand/40'
                      : 'text-aa-ink-muted hover:bg-aa-surface-hover'
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
      {error ? (
        <p className="mt-1 text-xs font-medium text-aa-danger">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-aa-ink-muted">{t('platform.field_businessTypesHint')}</p>
      )}
      {form.defaultBusinessTypeId ? (
        <div className="mt-2 flex items-start gap-2 rounded-aa-md bg-aa-surface-sunken border border-aa-line px-2.5 py-1.5 text-xs text-aa-ink-muted">
          <Info size={14} className="mt-0.5 shrink-0 text-aa-brand" />
          <span>{t('platform.businessTypeDefaultHint', { code: defaultTypeName })}</span>
        </div>
      ) : null}
    </div>
  );
}
