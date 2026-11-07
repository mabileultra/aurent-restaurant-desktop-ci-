import { Hash, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PosReturnReceiptSearch({
  receiptQuery,
  onChange,
  lookupPending,
}) {
  const { t } = useTranslation();

  return (
    <section className="pos-return-modal__section">
      <label className="pos-return-modal__label" htmlFor="pos-return-receipt">
        {t('pos.returnReceipt')}
      </label>
      <div className="pos-return-modal__receipt-field">
        <span className="pos-return-modal__receipt-prefix" aria-hidden>
          {t('pos.returnReceiptPrefix')}
        </span>
        <div className="pos-return-modal__input-wrap pos-return-modal__input-wrap--digits">
          <Hash size={18} className="pos-return-modal__input-icon" aria-hidden />
          <input
            id="pos-return-receipt"
            value={receiptQuery}
            onChange={onChange}
            placeholder={t('pos.returnReceiptPh')}
            className="pos-return-modal__input pos-return-modal__input--digits"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            inputMode="text"
            aria-describedby="pos-return-receipt-hint"
          />
          {lookupPending ? (
            <Loader
              size={18}
              className="pos-return-modal__input-spinner pos-return-modal__spin"
              aria-hidden
            />
          ) : null}
        </div>
      </div>
      <p id="pos-return-receipt-hint" className="pos-return-modal__receipt-hint">
        {t('pos.returnReceiptDigitsHint')}
      </p>
    </section>
  );
}
