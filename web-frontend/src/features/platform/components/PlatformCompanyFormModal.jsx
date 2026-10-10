import { useTranslation } from 'react-i18next';
import { BaseButton, BaseInput, BaseModal } from '../../../components/ui';
import RegionDistrictFields from '../../shared/geo/RegionDistrictFields';

export default function PlatformCompanyFormModal({
  open,
  editing,
  form,
  isSaving,
  businessTypes,
  onClose,
  onFieldChange,
  onToggleBusinessType,
  onSetDefaultBusinessType,
  onSave,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  // Create: both required. Edit: legacy may stay empty; if one is set, both must be set.
  const hasRegion = Boolean(form.regionCode?.trim());
  const hasDistrict = Boolean(form.districtCode?.trim());
  const geoReady = editing
    ? (!hasRegion && !hasDistrict) || (hasRegion && hasDistrict)
    : (hasRegion && hasDistrict);

  return (
    <BaseModal
      title={editing ? t('platform.editCompany') : t('platform.addCompany')}
      onClose={onClose}
      size="lg"
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose} className="admin-btn-secondary">
            {t('common.cancel')}
          </BaseButton>
          <BaseButton
            disabled={!form.name.trim() || isSaving || form.businessTypeIds.length === 0 || !geoReady}
            onClick={onSave}
            className="admin-btn-primary"
          >
            {t('common.save')}
          </BaseButton>
        </>
      )}
    >
      {!editing ? (
        <p className="admin-soft-panel mb-4 px-3 py-2 text-xs">
          {t('platform.field_loginCodeAutoHint')}
        </p>
      ) : (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-xs text-slate-500">{t('platform.field_loginCode')}</p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-wider text-slate-900 dark:text-white">
            {editing.loginCode || '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t('platform.field_loginCodeReadonly')}</p>
        </div>
      )}

      {['name', 'legalName', 'tin', 'phone'].map((field) => (
        <BaseInput
          key={field}
          className="mb-3"
          label={t(`platform.field_${field}`)}
          value={form[field]}
          onChange={(e) => onFieldChange(field, e.target.value)}
        />
      ))}

      <RegionDistrictFields
        regionCode={form.regionCode}
        districtCode={form.districtCode}
        required={!editing}
        onChange={({ regionCode, districtCode }) => {
          onFieldChange('regionCode', regionCode);
          onFieldChange('districtCode', districtCode);
        }}
      />

      <BaseInput
        as="textarea"
        rows={2}
        className="mb-3"
        label={t('platform.field_address')}
        value={form.address}
        onChange={(e) => onFieldChange('address', e.target.value)}
      />

      <div className="mb-1">
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('platform.field_businessTypes')}
        </p>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          {businessTypes.map((bt) => {
            const checked = form.businessTypeIds.includes(bt.id);
            const isDefault = form.defaultBusinessTypeId === bt.id;
            return (
              <label
                key={bt.id}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <span className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleBusinessType(bt.id)}
                  />
                  <span>{bt.name}</span>
                  <span className="font-mono text-xs text-slate-400">{bt.code}</span>
                </span>
                {checked ? (
                  <button
                    type="button"
                    className={`rounded px-2 py-0.5 text-xs ${
                      isDefault
                        ? 'bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-deep)]'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => onSetDefaultBusinessType(bt.id)}
                  >
                    {isDefault ? t('platform.businessTypeDefault') : t('platform.businessTypeMakeDefault')}
                  </button>
                ) : null}
              </label>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-slate-500">{t('platform.field_businessTypesHint')}</p>
        {form.defaultBusinessTypeId ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            {t('platform.businessTypeDefaultHint', {
              code: businessTypes.find((bt) => bt.id === form.defaultBusinessTypeId)?.code ?? '',
            })}
          </p>
        ) : null}
      </div>
    </BaseModal>
  );
}
