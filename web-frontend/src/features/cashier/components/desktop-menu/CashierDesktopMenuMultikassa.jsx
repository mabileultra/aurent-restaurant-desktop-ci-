import { QrCode } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { multikassaApi } from '../../../../api/multikassa.api';
import {
  describeMultikassaStatus,
  useMultikassaCashierStatus,
} from '../../hooks/useMultikassaCashierStatus';
import { useCashierStore } from '../../../../hooks/useCashierStore';
import { useCashierShift } from '../../../../hooks/useCashierShift';

/**
 * Тумблер фискального QR в меню Aurent Desktop (кассир не ходит в админку касс).
 */
export default function CashierDesktopMenuMultikassa({ t }) {
  const { storeId } = useCashierStore();
  const { data: shift } = useCashierShift(storeId);
  const cashRegisterId = shift?.cashRegisterId ?? null;
  const qc = useQueryClient();
  const { data: caps, isLoading } = useMultikassaCashierStatus({
    storeId,
    cashRegisterId,
    enabled: storeId != null,
  });
  const status = describeMultikassaStatus(caps, t);
  const printQr = caps?.printFiscalQr !== false;

  const mutation = useMutation({
    mutationFn: (nextPrintQr) =>
      multikassaApi
        .updateCashierFlags(storeId, cashRegisterId, { printFiscalQr: nextPrintQr })
        .then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['multikassa-cashier-caps', storeId, cashRegisterId], data);
      qc.invalidateQueries({ queryKey: ['multikassa-cashier-caps', storeId, cashRegisterId] });
      toast.success(
        data?.printFiscalQr === false
          ? t('desktop.multikassaQrOffToast')
          : t('desktop.multikassaQrOnToast'),
      );
    },
    onError: (e) => {
      toast.error(e?.response?.data?.message || t('desktop.multikassaQrSaveFailed'));
    },
  });

  if (storeId == null) return null;

  return (
    <div className="cashier-desktop-menu__connectivity">
      <div className="cashier-desktop-menu__section-label">{t('desktop.multikassaSection')}</div>
      <p className={`cashier-desktop-menu__mk-status cashier-desktop-menu__mk-status--${status.tone}`}>
        {isLoading ? t('cashRegisters.multikassa.statusUnknown') : status.label}
      </p>
      <button
        type="button"
        className={[
          'cashier-desktop-menu__mode',
          'is-toggle',
          printQr ? 'is-online has-bridge' : 'is-offline',
        ]
          .filter(Boolean)
          .join(' ')}
        role="menuitemcheckbox"
        aria-checked={printQr}
        disabled={mutation.isPending || isLoading}
        onClick={() => mutation.mutate(!printQr)}
      >
        <span className="cashier-desktop-menu__mode-icon" aria-hidden>
          <QrCode size={14} strokeWidth={2} />
        </span>
        <span className="cashier-desktop-menu__item-text">
          <span>{t('desktop.multikassaPrintQr')}</span>
          <span className="cashier-desktop-menu__item-meta">
            {printQr ? t('desktop.multikassaPrintQrOn') : t('desktop.multikassaPrintQrOff')}
          </span>
        </span>
        <span className="cashier-desktop-menu__mode-switch" aria-hidden>
          <span className="cashier-desktop-menu__mode-knob" />
        </span>
      </button>
    </div>
  );
}
