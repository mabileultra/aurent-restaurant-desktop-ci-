import { useTranslation } from 'react-i18next';
import {
  RECEIPT_ALIGN,
  RECEIPT_BOLD_PCT_MAX,
  RECEIPT_BOLD_PCT_MIN,
  RECEIPT_SIZE_PCT_MAX,
  RECEIPT_SIZE_PCT_MIN,
  coerceReceiptFieldStyle,
  fieldControls,
} from '../../../receiptProfile/receiptFieldStyles';
import '../styles/receipt-field-style-controls.css';

const ALIGN_LABEL = { left: '←', center: '↔', right: '→' };

export default function ReceiptFieldStyleControls({ fieldKey, style, disabled, onChange }) {
  const { t } = useTranslation();
  const ctrl = fieldControls(fieldKey);
  const st = coerceReceiptFieldStyle(style);

  if (!ctrl.size && !ctrl.bold && !ctrl.align) return null;

  return (
    <div className="rst-receipt-style">
      {ctrl.align ? (
        <div className="rst-receipt-style__align" role="group" aria-label={t('rst.admin.printAlign', { defaultValue: 'Выравнивание' })}>
          {RECEIPT_ALIGN.map((id) => (
            <button
              key={id}
              type="button"
              className={`rst-receipt-style__align-btn${st.align === id ? ' is-on' : ''}`}
              disabled={disabled}
              title={t(`rst.admin.printAlign_${id}`, {
                defaultValue: id === 'left' ? 'Влево' : id === 'right' ? 'Вправо' : 'По центру',
              })}
              onClick={() => onChange({ align: id })}
            >
              {ALIGN_LABEL[id]}
            </button>
          ))}
        </div>
      ) : null}

      {ctrl.size ? (
        <label className="rst-receipt-style__num">
          <span>{t('rst.admin.printSizePct', { defaultValue: 'Размер' })}</span>
          <input
            type="number"
            min={RECEIPT_SIZE_PCT_MIN}
            max={RECEIPT_SIZE_PCT_MAX}
            step={5}
            value={st.sizePct}
            disabled={disabled}
            onChange={(e) => onChange({ sizePct: e.target.value })}
          />
          <span className="rst-receipt-style__unit">%</span>
        </label>
      ) : null}

      {ctrl.bold ? (
        <label className="rst-receipt-style__num">
          <span>{t('rst.admin.printBoldPct', { defaultValue: 'Жирность' })}</span>
          <input
            type="number"
            min={RECEIPT_BOLD_PCT_MIN}
            max={RECEIPT_BOLD_PCT_MAX}
            step={10}
            value={st.boldPct}
            disabled={disabled}
            onChange={(e) => onChange({ boldPct: e.target.value })}
          />
          <span className="rst-receipt-style__unit">%</span>
        </label>
      ) : null}
    </div>
  );
}
