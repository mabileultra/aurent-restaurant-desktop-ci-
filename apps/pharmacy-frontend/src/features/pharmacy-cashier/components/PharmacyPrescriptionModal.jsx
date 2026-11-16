import { useEffect, useState } from 'react';
import PosModalPortal from '../../../components/shared/PosModalPortal';
import {
  PRESCRIPTION_NUMBER_MAX_LENGTH,
  prescriptionIssueMessageKey,
  validatePrescriptionNumber,
} from '@aurent/shared-fiscal';
import '../styles/pharmacy-card-details.css';

const PRESCRIPTION_INPUT_ID = 'pharmacy-prescription-number-input';

/**
 * Ввод номера электронного рецепта (клавиатура или сканер: Enter подтверждает, Esc закрывает).
 */
export default function PharmacyPrescriptionModal({
  open,
  initialValue = '',
  busy = false,
  onClose,
  onConfirm,
  t,
}) {
  const [value, setValue] = useState(initialValue);
  const [issue, setIssue] = useState(null);

  useEffect(() => {
    if (!open) return;
    setValue(initialValue || '');
    setIssue(null);
  }, [open, initialValue]);

  const handleSubmit = (event) => {
    event?.preventDefault?.();
    if (busy) return;
    const validation = validatePrescriptionNumber(value);
    if (!validation.ok) {
      setIssue(validation.issue);
      return;
    }
    onConfirm?.(validation.value);
  };

  const title = t('pos.prescriptionModalTitle');

  return (
    <PosModalPortal open={open} onClose={onClose}>
      <form
        className="pharmacy-modal pharmacy-modal__panel pharmacy-card-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={handleSubmit}
      >
        <header className="pharmacy-modal__head">
          <h2 className="pharmacy-modal__title">{title}</h2>
          <button
            type="button"
            className="pharmacy-modal__close"
            onClick={onClose}
            disabled={busy}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </header>

        <div className="pharmacy-card-modal__body">
          <div className="pharmacy-card-fields__group">
            <label className="pharmacy-card-fields__label" htmlFor={PRESCRIPTION_INPUT_ID}>
              {t('pos.prescriptionModalHint')}
            </label>
            <input
              id={PRESCRIPTION_INPUT_ID}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoFocus
              disabled={busy}
              maxLength={PRESCRIPTION_NUMBER_MAX_LENGTH}
              className={`pharmacy-card-fields__input${issue ? ' pharmacy-card-fields__input--error' : ''}`}
              placeholder={t('pos.prescriptionPlaceholder')}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                if (issue) setIssue(null);
              }}
            />
            {issue ? (
              <p className="pharmacy-card-fields__error" role="alert">
                {t(prescriptionIssueMessageKey(issue))}
              </p>
            ) : null}
          </div>

          <div className="pharmacy-card-modal__actions">
            <button
              type="button"
              className="pharmacy-card-modal__btn"
              onClick={onClose}
              disabled={busy}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="pharmacy-card-modal__btn pharmacy-card-modal__btn--primary"
              disabled={busy}
            >
              {t('pos.prescriptionConfirm')}
            </button>
          </div>
        </div>
      </form>
    </PosModalPortal>
  );
}
