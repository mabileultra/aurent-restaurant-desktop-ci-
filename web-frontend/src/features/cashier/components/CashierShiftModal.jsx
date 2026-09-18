// src/components/cashier/CashierShiftModal.jsx
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X, FileText, Printer, Loader, DoorOpen, DoorClosed } from 'lucide-react';
import toast from 'react-hot-toast';
import { cashierShiftApi } from '../../../services/api';
import PosModalPortal from '../../../components/shared/PosModalPortal';
import ShiftReportPrintBody from './ShiftReportPrintBody';
import ThermalReportPrintPortal from '../../../components/shared/ThermalReportPrintPortal';
import { useAuthStore } from '../../../store/authStore';
import { useConnectivityStore } from '../../../store/connectivityStore';
import {
  fetchCurrentCashierShift,
  useOpenCashierShift,
  useCloseCashierShift,
  useXReportCashierShift,
  shiftQueryKey,
} from '../../../hooks/useCashierShift';
import { resolvePosShiftOpenErrorMessage } from '../../../utils/resolvePosShiftOpenError';
import { resolveMultikassaFiscalErrorMessage } from '../../../services/multikassa';
import {
  resolveActiveShiftForModalAction,
  resolveShiftModalSession,
} from '../utils/shiftModalSession';

export default function CashierShiftModal({
  open,
  onClose,
  storeId,
  storeName,
  cashierName,
  shift,
  onShiftUpdated,
  catalogKind,
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const isPharmacy = catalogKind === 'pharmacy';
  const [printReport, setPrintReport] = useState(null);
  const [printToken, setPrintToken] = useState(0);
  /** null = сверяем с сервером; не рисуем кнопки по stale-кэшу React Query. */
  const [sessionOpen, setSessionOpen] = useState(null);
  /** Свежая смена с fetch при открытии модалки — для Close/X/Z, не prop из кэша. */
  const [sessionShift, setSessionShift] = useState(null);
  const printAfterLoadRef = useRef(null);
  const openSeqRef = useRef(0);

  const queuePrint = (data) => {
    setPrintToken((n) => n + 1);
    setPrintReport(data);
  };

  const xMutation = useXReportCashierShift(storeId, { catalogKind });

  const applyNewShift = (newShift) => {
    qc.setQueryData(shiftQueryKey(storeId, userId, catalogKind), newShift);
    qc.invalidateQueries({ queryKey: ['my-sales'] });
    onShiftUpdated?.(newShift);
  };

  const zMutation = useMutation({
    mutationFn: () => cashierShiftApi.finalizeZReport(sessionShift?.id ?? shift?.id).then((r) => r.data),
    onSuccess: (data) => {
      applyNewShift(data.newShift);
      setSessionShift(data.newShift?.status === 'OPEN' ? data.newShift : null);
      setSessionOpen(data.newShift?.status === 'OPEN');
      qc.invalidateQueries({ queryKey: ['z-reports'] });
      toast.success(t('pos.zReportFinalized'));
      if (printAfterLoadRef.current === 'Z') {
        printAfterLoadRef.current = null;
        queuePrint(data.report);
      }
    },
    onError: (e) => {
      printAfterLoadRef.current = null;
      toast.error(e.response?.data?.message ?? t('pos.reportFailed'));
    },
  });

  const openMutation = useOpenCashierShift(storeId, { catalogKind });
  const closeMutation = useCloseCashierShift(storeId, { catalogKind });

  const handleCloseShift = () => {
    const active = resolveActiveShiftForModalAction(sessionShift);
    if (!active?.id) {
      toast.error(t('pos.shiftCloseFailed'));
      return;
    }
    closeMutation.mutate(
      { shiftId: active.id, shift: active },
      {
        onSuccess: (closedShift) => {
          setSessionOpen(false);
          setSessionShift(null);
          toast.success(t('pos.shiftClosedWithZReport'));
          onShiftUpdated?.(closedShift);
          onClose();
        },
        onError: (e) =>
          toast.error(
            resolveMultikassaFiscalErrorMessage(e, t, 'pos.shiftCloseFailed'),
          ),
      },
    );
  };

  useEffect(() => {
    if (!open) {
      setPrintReport(null);
      printAfterLoadRef.current = null;
      setSessionOpen(null);
      setSessionShift(null);
      return undefined;
    }
    if (storeId == null || userId == null) {
      setSessionOpen(false);
      setSessionShift(null);
      return undefined;
    }

    const seq = ++openSeqRef.current;
    setSessionOpen(null);
    setSessionShift(null);
    const storeNameHint = useConnectivityStore.getState().storeName || storeName || '';
    const user = useAuthStore.getState().user;

    qc.fetchQuery({
      queryKey: shiftQueryKey(storeId, userId, catalogKind),
      queryFn: () => fetchCurrentCashierShift(storeId, user, false, storeNameHint, { catalogKind }),
      staleTime: 0,
    })
      .then((fresh) => {
        if (openSeqRef.current !== seq) return;
        const next = resolveShiftModalSession(fresh);
        setSessionOpen(next.sessionOpen);
        setSessionShift(next.sessionShift);
      })
      .catch(() => {
        if (openSeqRef.current !== seq) return;
        setSessionOpen(false);
        setSessionShift(null);
      });

    return undefined;
  }, [open, storeId, userId, catalogKind, qc, storeName]);

  const resolving = open && sessionOpen === null;
  const isOpen = sessionOpen === true;
  const busy =
    resolving ||
    xMutation.isPending ||
    zMutation.isPending ||
    closeMutation.isPending ||
    openMutation.isPending ||
    Boolean(printReport);

  const handleXReport = () => {
    const active = resolveActiveShiftForModalAction(sessionShift);
    if (!active?.id) {
      toast.error(t('pos.reportFailed'));
      return;
    }
    printAfterLoadRef.current = 'X';
    xMutation.mutate(
      { shiftId: active.id, shift: active },
      {
        onSuccess: (data) => {
          if (printAfterLoadRef.current === 'X') {
            printAfterLoadRef.current = null;
            queuePrint(data);
          }
        },
        onError: (e) => {
          printAfterLoadRef.current = null;
          toast.error(resolveMultikassaFiscalErrorMessage(e, t, 'pos.reportFailed'));
        },
      },
    );
  };

  const handleZReport = () => {
    if (!(sessionShift?.id || shift?.id)) {
      toast.error(t('pos.reportFailed'));
      return;
    }
    printAfterLoadRef.current = 'Z';
    zMutation.mutate();
  };

  const metaShift = sessionShift || shift;
  const metaStore = metaShift?.storeName ?? storeName ?? '—';
  const metaCashier = metaShift?.cashierName ?? cashierName ?? '—';

  return (
    <>
      <PosModalPortal open={open} onClose={onClose}>
        <div
          className="pos-pay-modal pos-pay-modal--shift pos-pay-modal--shift-terminal"
          onMouseDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cashier-shift-modal-title"
        >
          <header className="cashier-shift-modal__head">
            <h2 id="cashier-shift-modal-title" className="pos-pay-modal__title">
              {t('pos.shiftTitle')}
            </h2>
            <button type="button" className="pos-pay-modal__close" onClick={onClose} aria-label={t('common.close')}>
              <X size={20} />
            </button>
          </header>
          <p className="cashier-shift-modal__meta">
            {metaStore} · {metaCashier}
          </p>
          <p className="cashier-shift-modal__status">
            {t('pos.shiftStatus')}:{' '}
            <span className={isOpen ? 'is-open' : ''}>
              {resolving
                ? t('pos.shiftChecking')
                : isOpen
                  ? t('pos.shiftOpen')
                  : t('pos.shiftClosedLabel')}
            </span>
          </p>
          {isOpen ? (
            <p className="cashier-shift-modal__hint">{t('pos.shiftReportsHint')}</p>
          ) : null}

          <div className="cashier-shift-modal__actions">
            {resolving ? (
              <button type="button" className="pos-shift-action" disabled>
                <Loader size={16} className="animate-spin" />
                {t('pos.shiftChecking')}
              </button>
            ) : isOpen ? (
              <>
                <button
                  type="button"
                  className="pos-shift-action"
                  disabled={busy}
                  onClick={handleXReport}
                >
                  {xMutation.isPending ? <Loader size={16} className="animate-spin" /> : <FileText size={16} />}
                  {t('pos.printXReport')}
                </button>
                {!isPharmacy ? (
                  <button
                    type="button"
                    className="pos-shift-action"
                    disabled={busy}
                    onClick={handleZReport}
                  >
                    {zMutation.isPending ? <Loader size={16} className="animate-spin" /> : <Printer size={16} />}
                    {t('pos.printZReport')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="pos-shift-action pos-shift-action--danger"
                  disabled={busy || !sessionShift?.id}
                  onClick={handleCloseShift}
                >
                  {closeMutation.isPending ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <DoorClosed size={16} aria-hidden />
                  )}
                  {t('pos.closeShift')}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="pos-shift-action pos-shift-action--primary"
                disabled={!storeId || busy}
                onClick={() =>
                  openMutation.mutate(undefined, {
                    onSuccess: (openedShift) => {
                      setSessionOpen(true);
                      setSessionShift(openedShift?.status === 'OPEN' ? openedShift : null);
                      toast.success(t('pos.shiftOpenedSuccess'));
                      onShiftUpdated?.(openedShift);
                      onClose();
                    },
                    onError: (e) =>
                      toast.error(
                        e?.code === 'MULTIKASSA_FISCAL_FAILED' || e?.code === 'MULTIKASSA_OFFLINE_BLOCKED'
                          ? resolveMultikassaFiscalErrorMessage(e, t)
                          : resolvePosShiftOpenErrorMessage(e, t, storeId),
                        {
                          id: 'pos-shift-open-error',
                        },
                      ),
                  })
                }
              >
                {openMutation.isPending ? <Loader size={16} className="animate-spin" /> : <DoorOpen size={16} />}
                {t('pos.openShift')}
              </button>
            )}
          </div>
        </div>
      </PosModalPortal>

      <ThermalReportPrintPortal
        open={Boolean(printReport)}
        printToken={printReport ? printToken : null}
        shiftReport={printReport}
        onClose={() => setPrintReport(null)}
        onPrinted={() => toast.success(t('receipt.printSent'))}
        onError={() => toast.error(t('receipt.printFailed'))}
      >
        {printReport ? <ShiftReportPrintBody report={printReport} /> : null}
      </ThermalReportPrintPortal>
    </>
  );
}
