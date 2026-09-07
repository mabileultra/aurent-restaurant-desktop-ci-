import { useState } from 'react';
import { QrCode, Settings2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { multikassaApi } from '../../../api/multikassa.api';
import MultikassaSettingsModal from '../../cash-registers/components/MultikassaSettingsModal';
import {
  describeMultikassaStatus,
  useMultikassaCashierStatus,
} from '../hooks/useMultikassaCashierStatus';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useCashierShift } from '../../../hooks/useCashierShift';
import { getApiErrorMessage } from '../../../utils/apiError';

const GENERIC_SERVER_ERROR = 'An unexpected error occurred';

function resolveQrToggleError(e, t) {
  const apiMsg = getApiErrorMessage(e, '');
  if (apiMsg === GENERIC_SERVER_ERROR || e?.response?.data?.code === 'INTERNAL_ERROR') {
    return t('desktop.multikassaQrSaveFailed');
  }
  return apiMsg || t('desktop.multikassaQrSaveFailed');
}

/**
 * Статус Multikassa + QR-тумблер + открытие настроек (если Multikassa выкл — QR не появится).
 */
export default function MultikassaCashierControls({ className = '' }) {
  const { t } = useTranslation();
  const { storeId } = useCashierStore();
  const { data: shift } = useCashierShift(storeId);
  const cashRegisterId = shift?.cashRegisterId ?? null;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const qc = useQueryClient();
  const { data: caps, isLoading } = useMultikassaCashierStatus({
    storeId,
    cashRegisterId,
    enabled: storeId != null,
  });
  const status = describeMultikassaStatus(caps, t);
  const printQr = caps?.printFiscalQr !== false;
  const enabled = Boolean(caps?.enabled);

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
        { id: 'multikassa-qr-toggle' },
      );
    },
    onError: (e) => {
      toast.error(resolveQrToggleError(e, t), { id: 'multikassa-qr-toggle' });
    },
  });

  const openSettings = () => {
    if (!cashRegisterId) {
      toast.error(t('cashRegisters.multikassa.needOpenShift'), { id: 'multikassa-settings' });
      return;
    }
    setSettingsOpen(true);
  };

  const onQrClick = () => {
    if (!enabled) {
      toast.error(t('cashRegisters.multikassa.enableFirstForQr'), { id: 'multikassa-qr-toggle' });
      openSettings();
      return;
    }
    mutation.mutate(!printQr);
  };

  if (storeId == null) return null;

  return (
    <>
      <div className={className || undefined}>
        <div className="pharmacy-pay-rail__mk-row">
          <button
            type="button"
            className={`pharmacy-pay-rail__mk pharmacy-pay-rail__mk--${status.tone} pharmacy-pay-rail__mk--btn`}
            title={t('cashRegisters.multikassa.openSettings')}
            onClick={openSettings}
          >
            {isLoading ? t('cashRegisters.multikassa.statusUnknown') : status.label}
          </button>
          <button
            type="button"
            className={`pharmacy-pay-rail__qr-toggle${enabled && printQr ? ' is-on' : ''}`}
            aria-pressed={enabled && printQr}
            disabled={mutation.isPending || isLoading}
            onClick={onQrClick}
            title={
              enabled
                ? t('cashRegisters.multikassa.printFiscalQr')
                : t('cashRegisters.multikassa.enableFirstForQr')
            }
          >
            <QrCode size={14} strokeWidth={2.25} aria-hidden />
            <span>{enabled && printQr ? 'QR' : 'QR off'}</span>
          </button>
          <button
            type="button"
            className="pharmacy-pay-rail__mk-settings"
            onClick={openSettings}
            title={t('cashRegisters.multikassa.openSettings')}
            aria-label={t('cashRegisters.multikassa.openSettings')}
          >
            <Settings2 size={14} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <MultikassaSettingsModal
        open={settingsOpen && Boolean(cashRegisterId)}
        cashRegisterId={cashRegisterId}
        onClose={() => {
          setSettingsOpen(false);
          qc.invalidateQueries({ queryKey: ['multikassa-cashier-caps', storeId, cashRegisterId] });
        }}
      />
    </>
  );
}
