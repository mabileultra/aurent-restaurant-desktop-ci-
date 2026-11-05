import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { X, Loader, RotateCcw, Receipt, Hash } from 'lucide-react';
import { printReturnReceiptWithToast } from '../../utils/printReturnReceipt';
import { isReadyReceiptLookup, parseReceiptLookupInput } from '../../utils/receiptLookup';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import PosModalPortal from '../shared/PosModalPortal';
import {
  buildReturnPayload,
  getReturnableLines,
  useReturnQtyState,
} from '../sale-return/SaleReturnLinesEditor';
import {
  posLookupSaleReceipt,
  posReturnSaleItems,
} from '../../services/pos/posReturnWithFiscal';
import { resolveMultikassaFiscalErrorMessage } from '../../services/multikassa';
import { resolvePharmacyApiError } from '../../pharmacy/errors/resolvePharmacyApiError';
import { parseReturnLookupError, clampReturnQtyToMarks } from './posReturnLookup';
import PosReturnSalePreview from './PosReturnSalePreview';

const RECEIPT_LOOKUP_DEBOUNCE_MS = 450;

export default function PosReturnModal({
  open,
  onClose,
  onSuccess,
  terminal = false,
  catalogKind,
  variant = 'default',
  cashRegisterId = null,
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [receiptQuery, setReceiptQuery] = useState('');
  const [reason, setReason] = useState('');
  const [sale, setSale] = useState(null);
  const [marksByItemId, setMarksByItemId] = useState({});
  const [lookupPending, setLookupPending] = useState(false);
  const lastLookupRef = useRef('');
  const saleRef = useRef(null);
  const debouncedQuery = useDebouncedValue(receiptQuery, RECEIPT_LOOKUP_DEBOUNCE_MS);
  saleRef.current = sale;
  const { qtyByItemId, setQty, selectAllMax, totalSelected } = useReturnQtyState(sale, open && !!sale);

  const reset = () => {
    setReceiptQuery('');
    setReason('');
    setSale(null);
    setMarksByItemId({});
    setLookupPending(false);
    lastLookupRef.current = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const lookupReceipt = useCallback(
    async (query) => {
      const code = String(query ?? '').trim();
      if (!code) {
        setSale(null);
        return;
      }
      if (lastLookupRef.current === code && saleRef.current) {
        return;
      }

      setLookupPending(true);
      setSale(null);
      lastLookupRef.current = code;

      try {
        const data = await posLookupSaleReceipt(code, { catalogKind });
        if (data.status === 'VOIDED') {
          toast.error(t('pos.returnAlreadyVoided'));
          return;
        }
        if (getReturnableLines(data).length === 0) {
          toast.error(t('pos.returnNoItems'));
          return;
        }
        setSale(data);
        toast.success(t('pos.returnFound', { receipt: data.receiptNumber }));
      } catch (e) {
        if (lastLookupRef.current === code) {
          setSale(null);
        }
        toast.error(parseReturnLookupError(e, t));
      } finally {
        setLookupPending(false);
      }
    },
    [t, catalogKind]
  );

  useEffect(() => {
    if (!open) return;
    if (!debouncedQuery || !isReadyReceiptLookup(debouncedQuery)) {
      if (!debouncedQuery) {
        setSale(null);
        lastLookupRef.current = '';
      }
      return;
    }
    lookupReceipt(debouncedQuery);
  }, [debouncedQuery, open, lookupReceipt]);

  const returnMutation = useMutation({
    mutationFn: ({ sale: s, qtyByItemId: qtys, reasonText, marks }) => {
      const payload = buildReturnPayload(
        s,
        clampReturnQtyToMarks(qtys, catalogKind === 'pharmacy' ? marks : null),
        reasonText.trim() || t('pos.returnDefaultReason')
      );
      if (!payload.lines.length) {
        return Promise.reject(new Error(t('pos.returnSelectQty')));
      }
      return posReturnSaleItems({
        sale: s,
        payload,
        storeId: s.storeId,
        catalogKind,
        marksByItemId: marks,
        cashRegisterId,
      });
    },
    onSuccess: async (_data, vars) => {
      const returnReason = (vars?.reasonText || '').trim() || t('pos.returnDefaultReason');
      toast.success(t('pos.returnSuccess'));
      qc.invalidateQueries({ queryKey: ['my-sales'] });
      qc.invalidateQueries({ queryKey: ['sales-ledger'] });
      qc.invalidateQueries({ queryKey: ['returns'] });
      qc.invalidateQueries({ queryKey: ['cashier-shift'] });
      qc.invalidateQueries({ queryKey: ['pos-products'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-fefo-hints'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-lots'] });

      if (vars?.sale) {
        await printReturnReceiptWithToast({
          originalSale: vars.sale,
          qtyByItemId: vars.qtyByItemId,
          reason: returnReason,
          t,
        });
      }

      reset();
      onClose();
      onSuccess?.();
    },
    onError: (e) => toast.error(
      e?.code === 'MULTIKASSA_FISCAL_FAILED'
        || e?.code === 'MULTIKASSA_MARKING_REJECTED'
        || e?.code === 'MULTIKASSA_MARKING_UNAVAILABLE'
        || e?.code === 'MULTIKASSA_OFFLINE_BLOCKED'
        || e?.message === 'MULTIKASSA_OFFLINE_BLOCKED'
        ? resolveMultikassaFiscalErrorMessage(e, t, 'pos.returnFailed')
        : resolvePharmacyApiError(e, t, 'pos.returnFailed'),
    ),
  });

  const handleReceiptChange = (e) => {
    setReceiptQuery(parseReceiptLookupInput(e.target.value));
  };

  return (
    <PosModalPortal open={open} onClose={handleClose}>
      <div
        className={`pos-return-modal${terminal ? ' pos-return-modal--terminal' : ''}${
          sale ? ' pos-return-modal--partial' : ''
        }${variant === 'pharmacy' ? ' pharmacy-modal' : ''}`}
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
                  onChange={handleReceiptChange}
                  placeholder={t('pos.returnReceiptPh')}
                  className="pos-return-modal__input pos-return-modal__input--digits"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                  inputMode="text"
                  aria-describedby="pos-return-receipt-hint"
                />
                {lookupPending ? (
                  <Loader size={18} className="pos-return-modal__input-spinner pos-return-modal__spin" aria-hidden />
                ) : null}
              </div>
            </div>
            <p id="pos-return-receipt-hint" className="pos-return-modal__receipt-hint">
              {t('pos.returnReceiptDigitsHint')}
            </p>
          </section>

          {sale ? (
            <PosReturnSalePreview
              sale={sale}
              totalSelected={totalSelected}
              onSelectAll={selectAllMax}
              qtyByItemId={qtyByItemId}
              onQtyChange={setQty}
              catalogKind={catalogKind}
              cashRegisterId={cashRegisterId}
              onMarkAccept={(lineId, qty, marks) => {
                setQty(lineId, qty);
                setMarksByItemId((prev) => ({ ...prev, [lineId]: marks }));
              }}
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
            disabled={!sale || totalSelected <= 0 || returnMutation.isPending}
            onClick={() =>
              returnMutation.mutate({
                sale,
                qtyByItemId,
                reasonText: reason,
                marks: marksByItemId,
              })
            }
          >
            {returnMutation.isPending ? (
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
