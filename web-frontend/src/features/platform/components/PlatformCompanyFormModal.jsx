import React from 'react';
import { useTranslation } from 'react-i18next';
import { Power } from 'lucide-react';
import { BaseButton, BaseInput, BaseModal } from '../../../components/ui';
import RegionDistrictFields from '../../shared/geo/RegionDistrictFields';
import FormDraftNotice from '../../../components/shared/FormDraftNotice';
import CompanyBusinessTypeSelector from './CompanyBusinessTypeSelector';
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
  isDraftRestored = false,
  onClearDraft,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  const hasRegion = Boolean(form.regionCode?.trim());
  const hasDistrict = Boolean(form.districtCode?.trim());
  const geoReady = editing
    ? (!hasRegion && !hasDistrict) || (hasRegion && hasDistrict)
    : (hasRegion && hasDistrict);

  const isTinValid = !form.tin || form.tin.length === 9;

  const handlePhoneChange = (e) => {
    onFieldChange('phone', formatUzPhone(e.target.value));
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
      closeLabel={t('common.close', { defaultValue: 'Yopish' })}
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose} className="admin-btn-secondary">
            {t('common.cancel')}
          </BaseButton>
          <BaseButton
            requiresOnline
            disabled={!form.name.trim() || isSaving || form.businessTypeIds.length === 0 || !geoReady || !isTinValid}
            onClick={onSave}
            className="admin-btn-primary"
          >
            {t('common.save')}
          </BaseButton>
        </>
      )}
    >
      {!editing && isDraftRestored ? (
        <FormDraftNotice onClear={onClearDraft} />
      ) : null}

      {!editing ? (
        <p className="admin-soft-panel mb-4 px-3 py-2 text-xs">
          {t('platform.field_loginCodeAutoHint')}
        </p>
      ) : (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
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
          id="company-field-name"
          label={t('platform.field_name')}
          value={form.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
          placeholder={t('platform.field_name')}
          required
        />
        <BaseInput
          id="company-field-legalName"
          label={t('platform.field_legalName')}
          value={form.legalName}
          onChange={(e) => onFieldChange('legalName', e.target.value)}
          placeholder={t('platform.field_legalName')}
        />
      </div>

      {/* Row 2: STIR + Telefon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <BaseInput
          id="company-field-tin"
          label={t('platform.field_tin')}
          value={form.tin}
          onChange={handleTinChange}
          placeholder="123456789"
          inputMode="numeric"
          maxLength={9}
          error={!isTinValid ? t('platform.tinMustBe9Digits', { defaultValue: 'STIR 9 ta raqam bo‘lishi shart' }) : undefined}
        />
        <BaseInput
          id="company-field-phone"
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
        id="company-field-address"
        rows={2}
        className="mb-3"
        label={t('platform.field_address')}
        value={form.address}
        onChange={(e) => onFieldChange('address', e.target.value)}
      />

      {/* Row 5: Holat (Active toggle in edit mode) */}
      {editing ? (
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 mb-3">
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {t('common.status')}: {form.active ? t('common.active') : t('common.inactive')}
            </div>
            <div className="text-[11px] text-slate-500">
              {form.active ? 'Kompaniya faol, savdo do‘konlari ishlaydi' : 'Kompaniya faolsizlantirilgan (nofaol)'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFieldChange('active', !form.active)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              form.active
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Power size={13} />
            <span>{form.active ? t('platform.deactivate', { defaultValue: 'Faolsizlantirish' }) : t('platform.activate', { defaultValue: 'Faollashtirish' })}</span>
          </button>
        </div>
      ) : null}

      {/* Row 6: Biznes turlari */}
      <CompanyBusinessTypeSelector
        t={t}
        form={form}
        businessTypes={businessTypes}
        onToggleBusinessType={onToggleBusinessType}
        onSetDefaultBusinessType={onSetDefaultBusinessType}
      />
    </BaseModal>
  );
}
