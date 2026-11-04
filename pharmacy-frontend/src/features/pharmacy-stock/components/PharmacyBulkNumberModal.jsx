import { useEffect, useState } from 'react';
import { BaseButton, BaseModal } from '../../../components/ui';

export default function PharmacyBulkNumberModal({
  open,
  onClose,
  t,
  title,
  hint,
  fieldLabel,
  max = 100,
  saving,
  onSubmit,
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setValue('');
    setError('');
  }, [open]);

  const submit = () => {
    const n = Number(String(value).replace(',', '.').trim());
    if (value === '' || !Number.isFinite(n) || n < 0 || n > max) {
      setError(t('pharmacyStock.bulkValueInvalid'));
      return;
    }
    onSubmit(value);
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton onClick={submit} disabled={saving}>
            {saving ? t('common.saving') : t('pharmacyStock.bulkApply')}
          </BaseButton>
        </>
      )}
    >
      <div className="pharmacy-stock">
        {hint ? <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{hint}</p> : null}
        <label className="pharm-line-modal__field">
          <span className="pharm-line-modal__label">{fieldLabel}</span>
          <input
            type="number"
            step="0.01"
            min="0"
            max={max}
            className={`pharm-line-modal__input pharm-line-modal__input--num${error ? ' pharm-line-modal__input--danger' : ''}`}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
          {error ? <span className="mt-1 text-xs text-red-600">{error}</span> : null}
        </label>
      </div>
    </BaseModal>
  );
}
