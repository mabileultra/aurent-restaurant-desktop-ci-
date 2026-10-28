import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { BaseButton, BaseInput, BaseModal } from '../../../components/ui';
import RegionDistrictFields from '../../shared/geo/RegionDistrictFields';
import { formatUzPhone } from '../../../utils/phoneUz';

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

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const formatted = formatUzPhone(raw);
    onFieldChange('phone', formatted);
  };

  const handleTinChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 9);
    onFieldChange('tin', digitsOnly);
  };

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

      {/* Row 1: Nomi + Yuridik nomi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <BaseInput
          label={`${t('platform.field_name')} *`}
          value={form.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
          placeholder={t('platform.field_name')}
          required
        />
        <BaseInput
          label={t('platform.field_legalName')}
          value={form.legalName}
          onChange={(e) => onFieldChange('legalName', e.target.value)}
          placeholder={t('platform.field_legalName')}
        />
      </div>

      {/* Row 2: STIR + Telefon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <BaseInput
          label={t('platform.field_tin')}
          value={form.tin}
          onChange={handleTinChange}
          placeholder="123456789"
          inputMode="numeric"
          maxLength={9}
        />
        <BaseInput
          label={t('platform.field_phone')}
          value={form.phone}
          onChange={handlePhoneChange}
          placeholder="+998 (90) 123-45-67"
        />
      </div>

      {/* Row 3: Viloyat + Tuman */}
      <RegionDistrictFields
        regionCode={form.regionCode}
        districtCode={form.districtCode}
        required={!editing}
        onChange={({ regionCode, districtCode }) => {
          onFieldChange('regionCode', regionCode);
          onFieldChange('districtCode', districtCode);
        }}
      />

      {/* Row 4: Manzil */}
      <BaseInput
        as="textarea"
        rows={2}
        className="mb-3"
        label={t('platform.field_address')}
        value={form.address}
        onChange={(e) => onFieldChange('address', e.target.value)}
      />

      {/* Row 5: Biznes turlari */}
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
            <span>
              {t('platform.businessTypeDefaultHint', {
                code: t(`productTemplates.businessTypes.${businessTypes.find((bt) => bt.id === form.defaultBusinessTypeId)?.code}`, {
                  defaultValue: businessTypes.find((bt) => bt.id === form.defaultBusinessTypeId)?.code ?? '',
                }),
              })}
            </span>
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
}
