import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import {
  DoorClosed,
  DoorOpen,
  FileText,
  Loader,
  Printer,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BaseInput } from '../../../../components/ui';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { toastApiError } from '../../../../utils/apiError';
import { rstShiftApi } from '../../../api/shift.api';
import ShiftReportPrintBody from './ShiftReportPrintBody';
import ShiftReportPrintPortal from './ShiftReportPrintPortal';
import '../../styles/restaurant-shift-modal.css';

function enrichReport(report, { storeName, cashierName }) {
  if (!report) return null;
  return {
    ...report,
    storeName: report.storeName || storeName || null,
    cashierName: report.cashierName || cashierName || null,
  };
}

function fmtAt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Unified shift modal: info + open/close cash + X/Z print (Z auto on close).
 */
export default function RestaurantShiftModal({
  open,
  onClose,
  storeId,
  storeName,
  cashierName,
  shift,
  t,
}) {
  const qc = useQueryClient();
  const [openingCash, setOpeningCash] = useState('0');
  const [closingCash, setClosingCash] = useState('0');
  const [printReport, setPrintReport] = useState(null);
  const [printToken, setPrintToken] = useState(0);
  const closeAfterPrintRef = useRef(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['rst-shift-current', storeId] });
  };

  useEffect(() => {
    if (!open) {
      setPrintReport(null);
      closeAfterPrintRef.current = false;
      return;
    }
    setOpeningCash('0');
    setClosingCash(String(shift?.openingCash ?? shift?.cashAmount ?? 0));
  }, [open, shift?.id, shift?.openingCash, shift?.cashAmount]);

  const queuePrint = (report) => {
    const next = enrichReport(report, { storeName, cashierName });
    if (!next) return;
    setPrintToken((n) => n + 1);
    setPrintReport(next);
  };

  const openMutation = useMutation({
    mutationFn: () =>
      rstShiftApi.open(storeId, { openingCash: Number(openingCash) || 0 }).then((r) => r.data),
    onSuccess: () => {
      invalidate();
      toast.success(t('rst.shift.opened'));
      onClose?.();
    },
    onError: (err) => toastApiError(err, t('rst.shift.openFailed')),
  });

  const closeMutation = useMutation({
    mutationFn: () =>
      rstShiftApi
        .close(shift.id, { closingCash: Number(closingCash) || 0 })
        .then((r) => r.data),
    onSuccess: (data) => {
      invalidate();
      toast.success(t('pos.shiftClosedWithZReport'));
      const zReport = data?.zReport || data?.report;
      if (zReport) {
        closeAfterPrintRef.current = true;
        queuePrint(zReport);
      } else {
        onClose?.();
      }
    },
    onError: (err) => toastApiError(err, t('rst.shift.closeFailed')),
  });

  const xMutation = useMutation({
    mutationFn: () => rstShiftApi.xReport(shift.id).then((r) => r.data),
    onSuccess: (report) => {
      closeAfterPrintRef.current = false;
      queuePrint(report);
    },
    onError: (err) => toastApiError(err, t('pos.reportFailed')),
  });

  const zMutation = useMutation({
    mutationFn: () => rstShiftApi.zReportPreview(shift.id).then((r) => r.data),
    onSuccess: (report) => {
      closeAfterPrintRef.current = false;
      queuePrint(report);
    },
    onError: (err) => toastApiError(err, t('pos.reportFailed')),
  });

  if (!open || typeof document === 'undefined') return null;

  const isOpen = Boolean(shift?.id);
  const busy =
    openMutation.isPending ||
    closeMutation.isPending ||
    xMutation.isPending ||
    zMutation.isPending ||
    Boolean(printReport);

  return (
    <>
      {createPortal(
        <div className="rst-shift-modal" role="presentation">
          <button
            type="button"
            className="rst-shift-modal__backdrop"
            aria-label={t('common.cancel')}
            onClick={onClose}
          />
          <div
            className="rst-shift-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rst-shift-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="rst-shift-modal__head">
              <h2 id="rst-shift-modal-title">{t('pos.shiftTitle')}</h2>
              <button
                type="button"
                className="rst-shift-modal__close"
                onClick={onClose}
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </header>

            <p className="rst-shift-modal__meta">
              {storeName || '—'}
              {cashierName ? ` · ${cashierName}` : ''}
            </p>
            <p className="rst-shift-modal__status">
              {t('pos.shiftStatus')}:{' '}
              <span className={isOpen ? 'is-open' : ''}>
                {isOpen ? t('pos.shiftOpen') : t('pos.shiftClosedLabel')}
              </span>
            </p>

            {isOpen ? (
              <div className="rst-shift-modal__stats">
                <div>
                  <span>{t('rst.shift.sales')}</span>
                  <strong>{shift.saleCount ?? 0}</strong>
                </div>
                <div>
                  <span>{t('rst.shift.cash')}</span>
                  <strong>{fmtMoneyCompact(shift.cashAmount)}</strong>
                </div>
                <div>
                  <span>{t('rst.shift.card')}</span>
                  <strong>{fmtMoneyCompact(shift.cardAmount)}</strong>
                </div>
                <div>
                  <span>{t('rst.shift.total')}</span>
                  <strong>{fmtMoneyCompact(shift.totalAmount)}</strong>
                </div>
                <div className="rst-shift-modal__stats-wide">
                  <span>{t('zReports.openedAt')}</span>
                  <strong>{fmtAt(shift.openedAt)}</strong>
                </div>
                {shift.openOrderCount > 0 ? (
                  <div className="rst-shift-modal__stats-wide is-warn">
                    <span>{t('rst.shift.openOrders')}</span>
                    <strong>{shift.openOrderCount}</strong>
                  </div>
                ) : null}
              </div>
            ) : null}

            {isOpen ? (
              <p className="rst-shift-modal__hint">{t('rst.shift.reportsHint')}</p>
            ) : (
              <p className="rst-shift-modal__hint">{t('rst.shift.openHint')}</p>
            )}

            <label className="rst-shift-modal__cash">
              <span>{isOpen ? t('rst.shift.closingCash') : t('rst.shift.openingCash')}</span>
              <BaseInput
                type="number"
                min="0"
                step="0.01"
                value={isOpen ? closingCash : openingCash}
                onChange={(e) =>
                  isOpen ? setClosingCash(e.target.value) : setOpeningCash(e.target.value)
                }
                disabled={busy}
              />
            </label>

            <div className="rst-shift-modal__actions">
              {isOpen ? (
                <>
                  <button
                    type="button"
                    className="rst-shift-modal__btn"
                    disabled={busy}
                    onClick={() => xMutation.mutate()}
                  >
                    {xMutation.isPending ? <Loader size={16} className="spin" /> : <FileText size={16} />}
                    {t('pos.printXReport')}
                  </button>
                  <button
                    type="button"
                    className="rst-shift-modal__btn"
                    disabled={busy}
                    onClick={() => zMutation.mutate()}
                  >
                    {zMutation.isPending ? <Loader size={16} className="spin" /> : <Printer size={16} />}
                    {t('pos.printZReport')}
                  </button>
                  <button
                    type="button"
                    className="rst-shift-modal__btn rst-shift-modal__btn--danger"
                    disabled={busy || (shift.openOrderCount ?? 0) > 0}
                    onClick={() => closeMutation.mutate()}
                  >
                    {closeMutation.isPending ? (
                      <Loader size={16} className="spin" />
                    ) : (
                      <DoorClosed size={16} />
                    )}
                    {t('pos.closeShift')}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="rst-shift-modal__btn rst-shift-modal__btn--primary"
                  disabled={!storeId || busy}
                  onClick={() => openMutation.mutate()}
                >
                  {openMutation.isPending ? <Loader size={16} className="spin" /> : <DoorOpen size={16} />}
                  {t('pos.openShift')}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}

      <ShiftReportPrintPortal
        open={Boolean(printReport)}
        printToken={printReport ? printToken : null}
        shiftReport={printReport}
        t={t}
        onPrinted={() => toast.success(t('receipt.printSent'))}
        onError={(err) => toast.error(err?.message || t('receipt.printFailed'))}
        onClose={() => {
          setPrintReport(null);
          if (closeAfterPrintRef.current) {
            closeAfterPrintRef.current = false;
            onClose?.();
          }
        }}
      >
        {printReport ? <ShiftReportPrintBody report={printReport} t={t} /> : null}
      </ShiftReportPrintPortal>
    </>
  );
}
