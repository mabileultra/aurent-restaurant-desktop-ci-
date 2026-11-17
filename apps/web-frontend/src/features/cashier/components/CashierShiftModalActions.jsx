import React from 'react';
import { ArrowDownLeft, ArrowUpRight, DoorClosed, DoorOpen, FileText, Loader, Printer } from 'lucide-react';

export default function CashierShiftModalActions({
  resolving,
  isOpen,
  busy,
  sessionShift,
  storeId,
  isPharmacy,
  t,
  xMutation,
  zMutation,
  closeMutation,
  openMutation,
  handleXReport,
  handleZReport,
  handleCloseShift,
  handleOpenShift,
  setCashMovementDirection,
}) {
  if (resolving) {
    return (
      <div className="cashier-shift-modal__actions">
        <button type="button" className="pos-shift-action" disabled>
          <Loader size={16} className="animate-spin" />
          {t('pos.shiftChecking')}
        </button>
      </div>
    );
  }

  if (isOpen) {
    return (
      <div className="cashier-shift-modal__actions">
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
          className="pos-shift-action"
          disabled={busy || !sessionShift?.id}
          onClick={() => setCashMovementDirection('IN')}
        >
          <ArrowDownLeft size={16} className="text-emerald-500" />
          {t('pos.cashInAction', { defaultValue: 'Pul kiritish' })}
        </button>
        <button
          type="button"
          className="pos-shift-action"
          disabled={busy || !sessionShift?.id}
          onClick={() => setCashMovementDirection('OUT')}
        >
          <ArrowUpRight size={16} className="text-amber-500" />
          {t('pos.cashOutAction', { defaultValue: 'Pul yechish' })}
        </button>
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
      </div>
    );
  }

  return (
    <div className="cashier-shift-modal__actions">
      <button
        type="button"
        className="pos-shift-action pos-shift-action--primary"
        disabled={!storeId || busy}
        onClick={handleOpenShift}
      >
        {openMutation.isPending ? <Loader size={16} className="animate-spin" /> : <DoorOpen size={16} />}
        {t('pos.openShift')}
      </button>
    </div>
  );
}
