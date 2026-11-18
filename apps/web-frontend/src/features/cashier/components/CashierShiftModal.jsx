// src/components/cashier/CashierShiftModal.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import PosModalPortal from '../../../components/shared/PosModalPortal';
import ShiftReportPrintBody from './ShiftReportPrintBody';
import ShiftCashMovementModal from './ShiftCashMovementModal';
import ThermalReportPrintPortal from '../../../components/shared/ThermalReportPrintPortal';
import CashierShiftModalActions from './CashierShiftModalActions';
import { useCashierShiftModalState } from '../hooks/useCashierShiftModalState';

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
  const state = useCashierShiftModalState({
    open,
    onClose,
    storeId,
    storeName,
    cashierName,
    shift,
    onShiftUpdated,
    catalogKind,
    t,
  });

  const metaShift = state.sessionShift || shift;
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
            <span className={state.isOpen ? 'is-open' : ''}>
              {state.resolving
                ? t('pos.shiftChecking')
                : state.isOpen
                  ? t('pos.shiftOpen')
                  : t('pos.shiftClosedLabel')}
            </span>
          </p>
          {state.isOpen ? (
            <p className="cashier-shift-modal__hint">{t('pos.shiftReportsHint')}</p>
          ) : null}

          <CashierShiftModalActions
            resolving={state.resolving}
            isOpen={state.isOpen}
            busy={state.busy}
            sessionShift={state.sessionShift}
            storeId={storeId}
            isPharmacy={state.isPharmacy}
            t={t}
            xMutation={state.xMutation}
            zMutation={state.zMutation}
            closeMutation={state.closeMutation}
            openMutation={state.openMutation}
            handleXReport={state.handleXReport}
            handleZReport={state.handleZReport}
            handleCloseShift={state.handleCloseShift}
            handleOpenShift={state.handleOpenShift}
            setCashMovementDirection={state.setCashMovementDirection}
          />
        </div>
      </PosModalPortal>

      <ShiftCashMovementModal
        open={Boolean(state.cashMovementDirection)}
        direction={state.cashMovementDirection ?? 'IN'}
        shiftId={state.sessionShift?.id ?? shift?.id}
        onClose={() => state.setCashMovementDirection(null)}
        onSuccess={() => {
          state.qc.invalidateQueries({ queryKey: ['shifts'] });
          state.qc.invalidateQueries({ queryKey: ['my-sales'] });
        }}
      />

      <ThermalReportPrintPortal
        open={Boolean(state.printReport)}
        printToken={state.printReport ? state.printToken : null}
        shiftReport={state.printReport}
        onClose={() => state.setPrintReport(null)}
        onPrinted={() => toast.success(t('receipt.printSent'))}
        onError={() => toast.error(t('receipt.printFailed'))}
      >
        {state.printReport ? <ShiftReportPrintBody report={state.printReport} /> : null}
      </ThermalReportPrintPortal>
    </>
  );
}
