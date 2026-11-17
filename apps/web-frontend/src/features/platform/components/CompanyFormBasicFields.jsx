import React from 'react';
import { BaseInput } from '../../../components/ui';

export default function CompanyFormBasicFields({
  form,
  isEditing,
  errors,
  touched,
  hasSubmitted,
  markTouched,
  onFieldChange,
  handleTinChange,
  handlePhoneChange,
  t,
}) {
  return (
    <>
      {/* Row 1: Nomi + Yuridik nomi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <BaseInput
          id="company-field-name"
          className="aa-input border-aa-line-strong"
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
          className="aa-input border-aa-line-strong"
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
          className="aa-input border-aa-line-strong font-mono"
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
          className="aa-input border-aa-line-strong aa-num"
          label={t('platform.field_phone')}
          value={form.phone}
          onChange={handlePhoneChange}
          onBlur={() => markTouched('phone')}
          placeholder="+998 (90) 123-45-67"
          required={!isEditing}
          error={(hasSubmitted || touched.phone) ? errors.phone : undefined}
        />
      </div>
    </>
  );
}
