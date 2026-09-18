import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../components/ui';
import { marksForLine, requiredMarkCountForLine } from '../utils/pharmacyReceiptMarks';
import '../styles/pharmacy-receipt-marks.css';

export default function PharmacyReceiptMarksPanel({
  line,
  marksByLineId,
  busy,
  disabled,
  onAdd,
  onRemove,
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  if (!line?.markedProduct) return null;

  const marks = marksForLine(marksByLineId, line.id);
  const need = requiredMarkCountForLine(line);
  const done = marks.length >= need && need > 0;

  const submit = async () => {
    const ok = await onAdd?.(line, draft);
    if (ok) setDraft('');
  };

  return (
    <div className={`pharmacy-receipt-marks${done ? ' is-ready' : ''}`}>
      <div className="pharmacy-receipt-marks__head">
        <span className="pharmacy-receipt-marks__badge">{t('pharmacyStock.marks.badge')}</span>
        <span className="pharmacy-receipt-marks__count">
          {t('pharmacyStock.marks.count', { have: marks.length, need })}
        </span>
      </div>

      <div className="pharmacy-receipt-marks__scan">
        <input
          type="search"
          className="pharmacy-receipt-marks__input"
          value={draft}
          disabled={disabled || busy}
          placeholder={t('pharmacyStock.marks.placeholder')}
          aria-label={t('pharmacyStock.marks.placeholder')}
          autoComplete="off"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
        />
        <BaseButton size="sm" onClick={submit} disabled={disabled || busy || !draft.trim()}>
          {busy ? t('common.saving') : t('pharmacyStock.marks.add')}
        </BaseButton>
      </div>

      {marks.length > 0 ? (
        <ul className="pharmacy-receipt-marks__list">
          {marks.map((mark) => (
            <li key={mark.code} className="pharmacy-receipt-marks__item">
              <code>{mark.code.slice(0, 28)}{mark.code.length > 28 ? '…' : ''}</code>
              <button
                type="button"
                className="pharmacy-receipt-marks__remove"
                disabled={disabled || busy}
                onClick={() => onRemove?.(line.id, mark.code)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pharmacy-receipt-marks__hint">{t('pharmacyStock.marks.hint')}</p>
      )}
    </div>
  );
}
