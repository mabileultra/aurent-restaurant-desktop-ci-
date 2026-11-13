import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseButton, BaseInput, BaseModal } from '../../../components/ui';
import RegionDistrictFields from '../../shared/geo/RegionDistrictFields';
import FormDraftNotice from '../../../components/shared/FormDraftNotice';
import CompanyBusinessTypeSelector from './CompanyBusinessTypeSelector';
import CompanyStatusToggle from './CompanyStatusToggle';
import { formatUzPhone } from '../../../utils/phoneUz';
import { validateCompanyForm } from '../utils/companyFormValidationUtils';

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
  const [touched, setTouched] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!open) return null;

  const isEditing = Boolean(editing);
  const { errors, isValid } = validateCompanyForm(form, { isEditing, t });

  const markTouched = (field) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const handlePhoneChange = (e) => {
    markTouched('phone');
    onFieldChange('phone', formatUzPhone(e.target.value));
  };

  const handleTinChange = (e) => {
    markTouched('tin');
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 9);
    onFieldChange('tin', digitsOnly);
  };

  const handleSaveClick = (e) => {
    e?.preventDefault();
    setHasSubmitted(true);
    if (!isValid || isSaving) {
      const firstId = errors.name ? 'company-field-name' : errors.tin ? 'company-field-tin' : errors.phone ? 'company-field-phone' : null;
      if (firstId) document.getElementById(firstId)?.focus();
      return;
    }
    onSave?.();
  };

  return (
    <BaseModal
      title={isEditing ? t('platform.editCompany') : t('platform.addCompany')}
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
            disabled={isSaving}
            onClick={handleSaveClick}
            className="admin-btn-primary"
          >
            {isSaving ? t('common.saving', { defaultValue: 'Saqlanmoqda…' }) : t('common.save')}
          </BaseButton>
        </>
      )}
    >
      {!isEditing && isDraftRestored ? (
        <FormDraftNotice onClear={onClearDraft} />
      ) : null}

      {!isEditing ? (
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
          onChange={(e) => {
            markTouched('name');
            onFieldChange('name', e.target.value);
          }}
          onBlur={() => markTouched('name')}
          placeholder={t('platform.field_name')}
          required
          error={(hasSubmitted || touched.name) ? errors.name : undefined}
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
          onBlur={() => markTouched('tin')}
          placeholder="123456789"
          inputMode="numeric"
          maxLength={9}
          required={!isEditing}
          error={(hasSubmitted || touched.tin) ? errors.tin : undefined}
        />
        <BaseInput
          id="company-field-phone"
          label={t('platform.field_phone')}
          value={form.phone}
          onChange={handlePhoneChange}
          onBlur={() => markTouched('phone')}
          placeholder="+998 (90) 123-45-67"
          required={!isEditing}
          error={(hasSubmitted || touched.phone) ? errors.phone : undefined}
        />
      </div>

      {/* Row 3: Viloyat + Tuman */}
      <RegionDistrictFields
        regionCode={form.regionCode}
        districtCode={form.districtCode}
        required={!isEditing}
        regionError={(hasSubmitted || touched.region) ? errors.regionCode : undefined}
        districtError={(hasSubmitted || touched.district) ? errors.districtCode : undefined}
        onChange={({ regionCode, districtCode }) => {
          markTouched('region');
          if (districtCode) markTouched('district');
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
      {isEditing ? (
        <CompanyStatusToggle
          t={t}
          active={form.active}
          onToggle={() => onFieldChange('active', !form.active)}
        />
      ) : null}

      {/* Row 6: Biznes turlari */}
      <CompanyBusinessTypeSelector
        t={t}
        form={form}
        businessTypes={businessTypes}
        onToggleBusinessType={(typeId) => {
          markTouched('businessTypes');
          onToggleBusinessType(typeId);
        }}
        onSetDefaultBusinessType={onSetDefaultBusinessType}
        error={(hasSubmitted || touched.businessTypes) ? errors.businessTypeIds : undefined}
      />
    </BaseModal>
  );
}
