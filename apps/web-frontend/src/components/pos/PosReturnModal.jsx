// src/components/pos/PosReturnModal.jsx
import { useTranslation } from 'react-i18next';
import { X, Loader, RotateCcw, Receipt } from 'lucide-react';
import PosModalPortal from '../shared/PosModalPortal';
import PosReturnReceiptSearch from './PosReturnReceiptSearch';
import PosReturnSalePreview from './PosReturnSalePreview';
import { usePosReturnModal } from './usePosReturnModal';

export default function PosReturnModal({
  open,
  onClose,
  onSuccess,
  terminal = false,
  catalogKind,
}) {
  const { t } = useTranslation();
  const {
    receiptQuery,
    reason,
    setReason,
    sale,
    lookupPending,
    qtyByItemId,
    setQty,
    selectAllMax,
    totalSelected,
    isSubmitting,
    handleReceiptChange,
    handleClose,
    handleSubmitReturn,
  } = usePosReturnModal({ open, onClose, onSuccess, catalogKind });

  const isSubmitDisabled = !sale || totalSelected <= 0 || isSubmitting;

  return (
    <PosModalPortal open={open} onClose={handleClose}>
      <div
        className={`pos-return-modal${terminal ? ' pos-return-modal--terminal' : ''}${
          sale ? ' pos-return-modal--partial' : ''
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="pos-return-modal__header">
          <div className="pos-return-modal__header-icon" aria-hidden>
            <RotateCcw size={22} strokeWidth={2} />
          </div>
          <div className="pos-return-modal__header-text">
            <h2 className="pos-return-modal__title">{t('pos.returnTitle')}</h2>
            <p className="pos-return-modal__hint">{t('pos.returnHint')}</p>
          </div>
          <button
            type="button"
            className="pos-return-modal__close"
            onClick={handleClose}
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
        </header>

        <div className="pos-return-modal__body">
          <PosReturnReceiptSearch
            receiptQuery={receiptQuery}
            onChange={handleReceiptChange}
            lookupPending={lookupPending}
          />

          {sale ? (
            <PosReturnSalePreview
              sale={sale}
              qtyByItemId={qtyByItemId}
              setQty={setQty}
              selectAllMax={selectAllMax}
              totalSelected={totalSelected}
            />
          ) : (
            <div className="pos-return-modal__placeholder">
              <Receipt size={28} strokeWidth={1.5} aria-hidden />
              <p>{lookupPending ? t('pos.returnSearching') : t('pos.returnSearchPrompt')}</p>
            </div>
          )}

          <section className="pos-return-modal__section">
            <label className="pos-return-modal__label" htmlFor="pos-return-reason">
              {t('pos.returnReason')}
            </label>
            <textarea
              id="pos-return-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="pos-return-modal__textarea"
              placeholder={t('pos.returnReasonPh')}
            />
          </section>
        </div>

        <footer className="pos-return-modal__footer">
          <button type="button" className="pos-return-modal__cancel" onClick={handleClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="pos-return-modal__submit"
            disabled={isSubmitDisabled}
            onClick={handleSubmitReturn}
          >
            {isSubmitting ? (
              <Loader size={18} className="pos-return-modal__spin" />
            ) : (
              <RotateCcw size={18} />
            )}
            <span>{t('pos.returnConfirm')}</span>
          </button>
        </footer>
      </div>
    </PosModalPortal>
  );
}
