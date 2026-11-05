import { useState } from 'react';
import { BaseButton, BaseModal } from '../../../components/ui';
import { PHARM_RECEIPT_MASS_FIELDS } from '../utils/pharmacyReceiptMassFields';
import '../styles/pharmacy-receipt-mass.css';

export default function PharmacyReceiptMassEditBar({ t, mass }) {
  const fields = PHARM_RECEIPT_MASS_FIELDS;
  const [field, setField] = useState('VAT');
  const [value, setValue] = useState('12');
  const current = fields.find((item) => item.id === field) || fields[0];

  return (
    <>
      <div className="pharm-mass">
        <span className="pharm-mass__label">{t('pharmacyStock.massEdit')}</span>
        <select
          className="pharm-mass__select"
          value={field}
          onChange={(e) => {
            setField(e.target.value);
            setValue(e.target.value === 'VAT' ? '12' : '');
          }}
        >
          {fields.map((item) => (
            <option key={item.id} value={item.id}>{t(item.label)}</option>
          ))}
        </select>
        <input
          className="pharm-mass__input"
          type={current.kind === 'text' ? 'text' : current.kind}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          className="pharm-mass__btn"
          disabled={!mass.canEdit || mass.saving}
          onClick={() => mass.ask(field, value)}
        >
          {t('pharmacyStock.massEdit')}
        </button>
      </div>
      <BaseModal
        open={Boolean(mass.pending)}
        onClose={mass.cancel}
        title={t('pharmacyStock.massEditConfirmTitle')}
        size="sm"
        footer={(
          <>
            <BaseButton variant="secondary" onClick={mass.cancel} disabled={mass.saving}>
              {t('common.cancel')}
            </BaseButton>
            <BaseButton onClick={mass.confirm} disabled={mass.saving}>
              {mass.saving ? t('common.saving') : t('common.confirm')}
            </BaseButton>
          </>
        )}
      >
        <p className="pharm-mass__confirm">
          {t('pharmacyStock.massEditConfirm', {
            field: t(fields.find((item) => item.id === mass.pending?.field)?.label || current.label),
            value: mass.pending?.value || '—',
            count: mass.pending?.count || 0,
          })}
        </p>
      </BaseModal>
    </>
  );
}
