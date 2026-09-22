import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { Loader, RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { toastApiError } from '../../../../utils/apiError';
import { rstOrderApi } from '../../../api/order.api';
import CashierPaidReturnLines from './CashierPaidReturnLines';
import { useRstReturnQtyState } from '../hooks/useRstReturnQtyState';
import { buildRstReturnPayload, getReturnableLines } from '../utils/rstReturnLines';
import '../styles/cashier-paid-return-modal.css';

export default function CashierPaidReturnModal({
  open,
  sale,
  onClose,
  onSuccess,
  t,
}) {
  const [reason, setReason] = useState('');
  const { qtyByItemId, setQty, selectAllMax, totalSelected } = useRstReturnQtyState(sale, open);

  const mutation = useMutation({
    mutationFn: ({ sale: s, qtyByItemId: qtys, reasonText }) => {
      const payload = buildRstReturnPayload(s, qtys, reasonText || t('pos.returnDefaultReason'));
      if (!payload.lines.length) {
        return Promise.reject(new Error(t('pos.returnSelectQty')));
      }
      return rstOrderApi.refundItems(s.id, payload).then((r) => r.data);
    },
    onSuccess: () => {
      toast.success(t('pos.returnSuccess'));
      setReason('');
      onClose?.();
      onSuccess?.();
    },
    onError: (err) => {
      if (err?.message === t('pos.returnSelectQty')) {
        toast.error(err.message);
        return;
      }
      toastApiError(err, t('pos.returnFailed'));
    },
  });

  if (!open || typeof document === 'undefined') return null;

  const returnable = getReturnableLines(sale);
  const canSubmit =
    sale && returnable.length > 0 && totalSelected > 0 && !mutation.isPending;

  return createPortal(
    <div className="rst-paid-return" role="presentation">
      <button
        type="button"
        className="rst-paid-return__backdrop"
        aria-label={t('common.cancel')}
        onClick={onClose}
      />
      <div
        className="rst-paid-return__dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="rst-paid-return__header">
          <div className="rst-paid-return__header-icon" aria-hidden>
            <RotateCcw size={20} />
          </div>
          <div className="rst-paid-return__header-text">
            <h2>{t('pos.returnTitle')}</h2>
            <p>{t('pos.returnPartialHint')}</p>
          </div>
          <button
            type="button"
            className="rst-paid-return__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </header>

        <div className="rst-paid-return__body">
          {sale ? (
            <>
              <div className="rst-paid-return__preview">
                <strong>№{sale.receiptNumber}</strong>
                <span>
                  {t('pos.returnSelectedTotal')}: {fmtMoneyCompact(totalSelected)}
                </span>
              </div>
              <div className="rst-paid-return__toolbar">
                <button type="button" className="rst-paid-return__link" onClick={selectAllMax}>
                  {t('pos.returnSelectAll')}
                </button>
              </div>
              <CashierPaidReturnLines
                sale={sale}
                qtyByItemId={qtyByItemId}
                onQtyChange={setQty}
                t={t}
              />
              <label className="rst-paid-return__reason">
                <span>{t('pos.returnReason')}</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder={t('pos.returnDefaultReason')}
                />
              </label>
            </>
          ) : (
            <p className="rst-paid-return__empty">{t('common.loading')}</p>
          )}
        </div>

        <footer className="rst-paid-return__footer">
          <button type="button" className="rst-paid-return__btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="rst-paid-return__btn rst-paid-return__btn--danger"
            disabled={!canSubmit}
            onClick={() =>
              mutation.mutate({ sale, qtyByItemId, reasonText: reason })
            }
          >
            {mutation.isPending ? <Loader size={16} className="spin" /> : null}
            {mutation.isPending ? t('common.loading') : t('pos.returnConfirm')}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
