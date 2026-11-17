import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseButton, BaseInput, BaseModal } from '../../../components/ui';
import RegionDistrictFields from '../../shared/geo/RegionDistrictFields';
import FormDraftNotice from '../../../components/shared/FormDraftNotice';
import CompanyBusinessTypeSelector from './CompanyBusinessTypeSelector';
import CompanyStatusToggle from './CompanyStatusToggle';
import CompanyLoginCodePanel from './CompanyLoginCodePanel';
import CompanyFormBasicFields from './CompanyFormBasicFields';
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
      className="companies-form-modal rounded-aa-lg border-aa-line bg-aa-surface shadow-aa-modal"
      closeLabel={t('common.close', { defaultValue: 'Yopish' })}
      footer={(
        <div className="flex gap-2 justify-end w-full">
          <BaseButton variant="secondary" onClick={onClose} className="aa-btn aa-btn--secondary border-aa-line-strong aa-size-md">
            {t('common.cancel')}
          </BaseButton>
          <BaseButton
            requiresOnline
            disabled={isSaving}
            onClick={handleSaveClick}
            className="aa-btn aa-btn--primary aa-size-md"
          >
            {isSaving ? t('common.saving', { defaultValue: 'Saqlanmoqda…' }) : t('common.save')}
          </BaseButton>
        </div>
      )}
    >
      {!isEditing && isDraftRestored ? (
        <FormDraftNotice onClear={onClearDraft} />
      ) : null}

      <CompanyLoginCodePanel
        isEditing={isEditing}
        loginCode={editing?.loginCode}
        t={t}
      />

      <CompanyFormBasicFields
        form={form}
        isEditing={isEditing}
        errors={errors}
        touched={touched}
        hasSubmitted={hasSubmitted}
        markTouched={markTouched}
        onFieldChange={onFieldChange}
        handleTinChange={handleTinChange}
        handlePhoneChange={handlePhoneChange}
        t={t}
      />

      {/* Row 3: Viloyat + Tuman */}
      <RegionDistrictFields
        variant="aa"
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
        className="aa-input border-aa-line-strong aa-size-textarea h-auto mb-3"
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
