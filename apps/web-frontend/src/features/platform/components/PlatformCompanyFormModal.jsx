import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Alert from '../../../components/aa/Alert';
import Field from '../../../components/aa/Field';
import Input from '../../../components/aa/Input';
import Modal from '../../../components/aa/Modal';
import CompanyBusinessTypeSelector from './CompanyBusinessTypeSelector';
import CompanyFormGeoFields from './CompanyFormGeoFields';
import { formatUzPhone } from '../../../utils/phoneUz';
import { validateCompanyForm } from '../utils/companyFormValidationUtils';

/**
 * PlatformCompanyFormModal — Kompaniya qo‘shish va tahrirlash modali.
 * aa Modal (eni 720px), 2 ustunli grid (oraliq 16px).
 */
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
  const [touched, setTouched] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!open || !form) return null;

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

  const subtitle = isEditing
    ? `ID ${editing?.id} · kirish kodi ${editing?.loginCode || '—'}`
    : 'Kompaniya ma’lumotlari va faoliyat turlari';

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="!w-full !max-w-[720px]"
      title={(
        <div>
          <div className="text-[17px] font-semibold text-aa-ink leading-tight">
            {isEditing ? 'Kompaniyani tahrirlash' : 'Kompaniya qo‘shish'}
          </div>
          <p className="text-[13px] font-normal text-aa-ink-muted mt-0.5">
            {subtitle}
          </p>
        </div>
      )}
      secondaryAction={{
        label: 'Bekor qilish',
        onClick: onClose,
        disabled: isSaving,
      }}
      primaryAction={{
        label: 'Saqlash',
        onClick: handleSaveClick,
        loading: isSaving,
      }}
    >
      <div className="space-y-4">
        {/* Faqat qo‘shishda: kirish kodi haqida Alert info */}
        {!isEditing && (
          <Alert tone="info">
            Kirish kodi saqlangandan keyin avtomatik beriladi (5 xonali raqam). Kassa dasturini sozlashda shu kodni kiriting.
          </Alert>
        )}

        {/* 2 ustunli grid (oraliq 16px; mobilda 1 ustun) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nomi */}
          <Input
            id="company-field-name"
            label="Nomi"
            value={form.name || ''}
            onChange={(e) => {
              markTouched('name');
              onFieldChange('name', e.target.value);
            }}
            onBlur={() => markTouched('name')}
            placeholder="Kompaniya nomi"
            error={(hasSubmitted || touched.name) ? errors.name : undefined}
          />

          {/* Yuridik nomi (ixtiyoriy) */}
          <Input
            id="company-field-legalName"
            label="Yuridik nomi"
            optional
            value={form.legalName || ''}
            onChange={(e) => onFieldChange('legalName', e.target.value)}
            placeholder="Yuridik nomi"
          />

          {/* STIR: mono, inputMode="numeric", placeholder="9 ta raqam" */}
          <Input
            id="company-field-tin"
            label="STIR"
            value={form.tin || ''}
            onChange={handleTinChange}
            onBlur={() => markTouched('tin')}
            placeholder="9 ta raqam"
            inputMode="numeric"
            maxLength={9}
            className="font-mono font-normal text-[13px]"
            style={{ fontFamily: 'var(--aa-font-mono)', fontWeight: 400 }}
            error={(hasSubmitted || touched.tin) ? (errors.tin ? 'STIR 9 ta raqamdan iborat bo‘lishi kerak' : undefined) : undefined}
          />

          {/* Telefon */}
          <Input
            id="company-field-phone"
            label="Telefon"
            value={form.phone || ''}
            onChange={handlePhoneChange}
            onBlur={() => markTouched('phone')}
            placeholder="+998 90 123 45 67"
            error={(hasSubmitted || touched.phone) ? errors.phone : undefined}
          />

          {/* Viloyat va Tuman */}
          <CompanyFormGeoFields
            regionCode={form.regionCode}
            districtCode={form.districtCode}
            regionError={(hasSubmitted || touched.region) ? errors.regionCode : undefined}
            districtError={(hasSubmitted || touched.district) ? errors.districtCode : undefined}
            onRegionChange={(val) => {
              markTouched('region');
              onFieldChange('regionCode', val);
              onFieldChange('districtCode', '');
            }}
            onDistrictChange={(val) => {
              markTouched('district');
              onFieldChange('districtCode', val);
            }}
          />

          {/* Manzil (ixtiyoriy): textarea 80px, ikki ustun enida */}
          <div className="col-span-1 sm:col-span-2">
            <Field id="company-field-address" label="Manzil" optional>
              <textarea
                id="company-field-address"
                value={form.address || ''}
                onChange={(e) => onFieldChange('address', e.target.value)}
                placeholder="Ko‘cha, uy raqami, mo‘ljal"
                className="aa-input h-20 py-2 resize-none"
              />
            </Field>
          </div>
        </div>

        {/* Faoliyat turlari fieldset */}
        <CompanyBusinessTypeSelector
          t={t}
          form={form}
          businessTypes={businessTypes}
          onToggleBusinessType={(typeId) => {
            markTouched('businessTypes');
            onToggleBusinessType?.(typeId);
          }}
          onSetDefaultBusinessType={onSetDefaultBusinessType}
          error={(hasSubmitted || touched.businessTypes) ? (errors.businessTypeIds ? 'Kamida bitta faoliyat turini tanlang' : undefined) : undefined}
        />
      </div>
    </Modal>
  );
}
