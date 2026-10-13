import { Suspense, useState } from 'react';
import { lazyPage as lazy } from '../../../router/lazyWithRetry';
import { QrCode, Settings2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { multikassaApi } from '../../../api/multikassa.api';
import { cashierTerminalApi } from '../../../api/cashierTerminal.api';
import {
  describeMultikassaStatus,
  useMultikassaCashierStatus,
} from '../hooks/useMultikassaCashierStatus';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useCashierShiftView } from '../../../hooks/useCashierShiftView';
import { useCashierStoreProfile } from '../../../hooks/useCashierStoreProfile';
import { getApiErrorMessage } from '../../../utils/apiError';
import { buildTerminalRequest, resolveCashierTerminalIdentity } from '../../../utils/cashierTerminalIdentity';
import '../styles/fiscal-cashier-controls.css';

const MultikassaSettingsModal = lazy(() =>
  import('../../cash-registers/components/MultikassaSettingsModal'),
);

const GENERIC_SERVER_ERROR = 'An unexpected error occurred';

function resolveQrToggleError(e, t) {
  const apiMsg = getApiErrorMessage(e, '');
  if (apiMsg === GENERIC_SERVER_ERROR || e?.response?.data?.code === 'INTERNAL_ERROR') {
    return t('desktop.multikassaQrSaveFailed');
  }
  return apiMsg || t('desktop.multikassaQrSaveFailed');
}

/**
 * Только Multikassa + QR. FiscalDrive — отдельный FiscalDriveCashierControls.
 */
export default function MultikassaCashierControls({ className = '' }) {
  const { t } = useTranslation();
  const { storeId } = useCashierStore();
  const { isPharmacy } = useCashierStoreProfile();
  const { shift } = useCashierShiftView(storeId, {
    catalogKind: isPharmacy ? 'pharmacy' : 'grocery',
  });
  const shiftRegisterId = shift?.cashRegisterId ?? null;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsRegisterId, setSettingsRegisterId] = useState(null);
  const qc = useQueryClient();
  const { data: caps, isLoading } = useMultikassaCashierStatus({
    storeId,
    cashRegisterId: shiftRegisterId,
    enabled: storeId != null,
  });
  const cashRegisterId = shiftRegisterId ?? caps?.cashRegisterId ?? settingsRegisterId ?? null;
  const status = describeMultikassaStatus(caps, t);
  const printQr = caps?.printFiscalQr !== false;
  const enabled = Boolean(caps?.enabled);

  const mutation = useMutation({
    mutationFn: (nextPrintQr) =>
      multikassaApi
        .updateCashierFlags(storeId, cashRegisterId, { printFiscalQr: nextPrintQr })
        .then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['multikassa-cashier-caps', storeId, shiftRegisterId], data);
      qc.invalidateQueries({ queryKey: ['multikassa-cashier-caps', storeId, shiftRegisterId] });
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

  const openSettings = async () => {
    let registerId = cashRegisterId;
    if (!registerId && storeId != null) {
      try {
        const identity = await resolveCashierTerminalIdentity();
        const terminal = buildTerminalRequest(identity);
        if (terminal) {
          const reg = await cashierTerminalApi.register(storeId, terminal).then((r) => r.data);
          registerId = reg?.cashRegisterId ?? null;
          if (registerId != null) {
            setSettingsRegisterId(registerId);
            qc.invalidateQueries({ queryKey: ['multikassa-cashier-caps', storeId, shiftRegisterId] });
          }
        }
      } catch {
        /* fall through to toast */
      }
    }
    if (!registerId) {
      toast.error(t('cashRegisters.multikassa.needOpenShift'), { id: 'multikassa-settings' });
      return;
    }
    setSettingsRegisterId(registerId);
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

  const modalRegisterId = settingsRegisterId ?? cashRegisterId;

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

      {settingsOpen && modalRegisterId ? (
        <Suspense fallback={null}>
          <MultikassaSettingsModal
            open={settingsOpen}
            cashRegisterId={modalRegisterId}
            onClose={() => {
              setSettingsOpen(false);
              qc.invalidateQueries({ queryKey: ['multikassa-cashier-caps', storeId, shiftRegisterId] });
            }}
          />
        </Suspense>
      ) : null}
    </>
  );
}
