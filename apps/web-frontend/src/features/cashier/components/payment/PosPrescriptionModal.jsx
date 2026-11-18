import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PRESCRIPTION_NUMBER_MAX_LENGTH,
  prescriptionIssueMessageKey,
  validatePrescriptionNumber,
} from '@aurent/shared-fiscal';
import BaseModal from '../../../../components/ui/BaseModal';
import BaseButton from '../../../../components/ui/BaseButton';
import { usePrescriptionCheckoutGate } from '../../hooks/pos/usePrescriptionCheckoutGate';

const PRESCRIPTION_FORM_ID = 'pos-prescription-form';
const PRESCRIPTION_INPUT_ID = 'pos-prescription-number-input';

/**
 * Номер электронного рецепта перед продажей рецептурного препарата (AUR-3).
 * Состояние открытия — общий шлюз usePrescriptionCheckoutGate.
 */
export default function PosPrescriptionModal({ busy = false }) {
  const { t } = useTranslation();
  const gate = usePrescriptionCheckoutGate();
  const [value, setValue] = useState('');
  const [issue, setIssue] = useState(null);

  useEffect(() => {
    if (!gate.isOpen) return;
    setValue(gate.prescriptionNumber || '');
    setIssue(null);
  }, [gate.isOpen, gate.prescriptionNumber]);

  const handleSubmit = (event) => {
    event?.preventDefault?.();
    if (busy) return;
    const validation = validatePrescriptionNumber(value);
    if (!validation.ok) {
      setIssue(validation.issue);
      return;
    }
    gate.confirm(validation.value);
  };

  return (
    <BaseModal
      open={gate.isOpen}
      onClose={busy ? undefined : gate.close}
      size="sm"
      title={t('pos.prescriptionModalTitle')}
      closeLabel={t('common.close')}
      footer={
        <div className="pos-card-modal__actions">
          <BaseButton
            type="button"
            variant="secondary"
            className="pos-card-modal__cancel"
            onClick={gate.close}
            disabled={busy}
          >
            {t('common.cancel')}
          </BaseButton>
          <BaseButton
            type="submit"
            form={PRESCRIPTION_FORM_ID}
            variant="primary"
            className="pos-card-modal__submit"
            disabled={busy}
          >
            {t('pos.prescriptionConfirm')}
          </BaseButton>
        </div>
      }
    >
      <form id={PRESCRIPTION_FORM_ID} className="pos-card-modal__body" onSubmit={handleSubmit}>
        <div className="pos-card-fields__group">
          <label className="pos-card-fields__label" htmlFor={PRESCRIPTION_INPUT_ID}>
            {t('pos.prescriptionModalHint')}
          </label>
          <input
            id={PRESCRIPTION_INPUT_ID}
            type="text"
            inputMode="text"
            autoComplete="off"
            data-autofocus="true"
            disabled={busy}
            maxLength={PRESCRIPTION_NUMBER_MAX_LENGTH}
            className={`pos-card-fields__input${issue ? ' pos-card-fields__input--error' : ''}`}
            placeholder={t('pos.prescriptionPlaceholder')}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (issue) setIssue(null);
            }}
          />
          {issue ? (
            <p className="pos-card-fields__error" role="alert">
              {t(prescriptionIssueMessageKey(issue))}
            </p>
          ) : null}
        </div>
      </form>
    </BaseModal>
  );
}
