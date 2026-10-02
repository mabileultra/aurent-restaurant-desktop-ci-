import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { printShiftItemsReceipt } from '../../utils/printShiftItemsReceipt';
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
  const [openingConfirmed, setOpeningConfirmed] = useState(false);
  const [printReport, setPrintReport] = useState(null);
  const [printToken, setPrintToken] = useState(0);
  const closeAfterPrintRef = useRef(false);
  const itemsAfterPrintRef = useRef(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['rst-shift-current', storeId] });
    qc.invalidateQueries({ queryKey: ['rst-shift-last-closed', storeId] });
  };

  const shiftOpen = Boolean(shift?.id);
  const expectedCash = shift?.expectedCash != null
    ? Number(shift.expectedCash)
    : (Number(shift?.openingCash) || 0) + (Number(shift?.cashAmount) || 0)
      + (Number(shift?.cashIn) || 0) - (Number(shift?.cashOut) || 0) - (Number(shift?.collection) || 0);

  const lastClosedQuery = useQuery({
    queryKey: ['rst-shift-last-closed', storeId],
    queryFn: () => rstShiftApi.list(storeId).then((r) => (r.data ?? [])
      .find((row) => row.status === 'CLOSED') ?? null),
    enabled: open && !shiftOpen && storeId != null,
  });
  const lastClosed = lastClosedQuery.data ?? null;
  const carryCash = lastClosed?.closingCash != null ? Number(lastClosed.closingCash) : null;

  useEffect(() => {
    if (!open) {
      setPrintReport(null);
      closeAfterPrintRef.current = false;
      itemsAfterPrintRef.current = null;
      return;
    }
    setOpeningCash(carryCash != null ? String(carryCash) : '0');
    setClosingCash(String(expectedCash));
    setOpeningConfirmed(false);
  }, [open, shift?.id, expectedCash, carryCash]);

  const queuePrint = (report) => {
    const next = enrichReport(report, { storeName, cashierName });
    if (!next) return;
    setPrintToken((n) => n + 1);
    setPrintReport(next);
  };

  const openMutation = useMutation({
    mutationFn: () =>
      rstShiftApi.open(storeId, {
        openingCash: Number(openingCash) || 0,
        confirmOpening: carryCash == null ? undefined : openingConfirmed,
      }).then((r) => r.data),
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
        itemsAfterPrintRef.current = zReport;
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

  const isOpen = shiftOpen;
  const openingDiffers = carryCash != null && Number(openingCash) !== carryCash;
  const openOrders = Number(shift?.openOrderCount) || 0;
  const hasOpenOrders = openOrders > 0;
  const printBusy = Boolean(printReport);
  const busy =
    openMutation.isPending ||
    closeMutation.isPending ||
    xMutation.isPending ||
    zMutation.isPending ||
    printBusy;

  const handleCloseShift = () => {
    if (hasOpenOrders) {
      toast.error(t('rst.shift.closeBlockedOpenOrders', { count: openOrders }));
      return;
    }
    closeMutation.mutate();
  };

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
              <div className="rst-shift-modal__carry">
                <span>{t('rst.shift.expectedCash')}</span>
                <strong>{fmtMoneyCompact(expectedCash)}</strong>
              </div>
            ) : carryCash != null ? (
              <div className={`rst-shift-modal__carry${openingDiffers ? ' is-warn' : ''}`}>
                <span>
                  {t('rst.shift.carryFromLast')}
                  {lastClosed?.closedAt ? ` (${fmtAt(lastClosed.closedAt)})` : ''}
                </span>
                <strong>{fmtMoneyCompact(carryCash)}</strong>
              </div>
            ) : null}

            {isOpen ? (
              <p className="rst-shift-modal__hint">
                {hasOpenOrders
                  ? t('rst.shift.closeBlockedHint', { count: openOrders })
                  : t('rst.shift.reportsHint')}
              </p>
            ) : (
              <p className="rst-shift-modal__hint">{t('rst.shift.openHint')}</p>
            )}

            <label className="rst-shift-modal__cash">
              <span>{isOpen ? t('rst.shift.closingCashLeft') : t('rst.shift.openingCash')}</span>
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

            {!isOpen && carryCash != null ? (
              <label className="rst-shift-modal__confirm">
                <input
                  type="checkbox"
                  checked={openingConfirmed}
                  onChange={(e) => setOpeningConfirmed(e.target.checked)}
                  disabled={busy}
                />
                <span>{t('rst.shift.confirmOpening')}</span>
              </label>
            ) : null}

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
                    className={`rst-shift-modal__btn rst-shift-modal__btn--danger${hasOpenOrders ? ' is-blocked' : ''}`}
                    disabled={busy}
                    title={hasOpenOrders ? t('rst.shift.closeBlockedOpenOrders', { count: openOrders }) : undefined}
                    onClick={handleCloseShift}
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
                  disabled={!storeId || busy || (carryCash != null && !openingConfirmed)}
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
        onClose={async () => {
          setPrintReport(null);
          const itemsReport = itemsAfterPrintRef.current;
          itemsAfterPrintRef.current = null;
          if (itemsReport) {
            try {
              await printShiftItemsReceipt({ report: itemsReport, storeName, cashierName, t });
            } catch (err) {
              toast.error(err?.message || t('receipt.printFailed'));
            }
          }
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
