import { Suspense, useState } from 'react';
import { lazyPage as lazy } from '../../../router/lazyWithRetry';
import { Cpu } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { cashierTerminalApi } from '../../../api/cashierTerminal.api';
import { useMultikassaCashierStatus } from '../hooks/useMultikassaCashierStatus';
import { isFiscalDriveProvider } from '../../../services/fiscal';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useCashierShiftView } from '../../../hooks/useCashierShiftView';
import { useCashierStoreProfile } from '../../../hooks/useCashierStoreProfile';
import { buildTerminalRequest, resolveCashierTerminalIdentity } from '../../../utils/cashierTerminalIdentity';
import '../styles/fiscal-cashier-controls.css';

const FiscalDriveSettingsModal = lazy(() =>
  import('../../cash-registers/components/FiscalDriveSettingsModal'),
);

/** Отдельная кнопка FiscalDrive на pay rail (не смешивать с Multikassa). */
export default function FiscalDriveCashierControls({ className = '' }) {
  const { t } = useTranslation();
  const { storeId } = useCashierStore();
  const { isPharmacy } = useCashierStoreProfile();
  const { shift } = useCashierShiftView(storeId, {
    catalogKind: isPharmacy ? 'pharmacy' : 'grocery',
  });
  const shiftRegisterId = shift?.cashRegisterId ?? null;
  const [open, setOpen] = useState(false);
  const [registerId, setRegisterId] = useState(null);
  const qc = useQueryClient();
  const { data: caps, isLoading } = useMultikassaCashierStatus({
    storeId,
    cashRegisterId: shiftRegisterId,
    enabled: storeId != null,
  });
  const cashRegisterId = shiftRegisterId ?? caps?.cashRegisterId ?? registerId ?? null;
  const isFiscalDrive = isFiscalDriveProvider(caps);

  const openSettings = async () => {
    let id = cashRegisterId;
    if (!id && storeId != null) {
      try {
        const identity = await resolveCashierTerminalIdentity();
        const terminal = buildTerminalRequest(identity);
        if (terminal) {
          const reg = await cashierTerminalApi.register(storeId, terminal).then((r) => r.data);
          id = reg?.cashRegisterId ?? null;
          if (id != null) {
            setRegisterId(id);
            qc.invalidateQueries({ queryKey: ['multikassa-cashier-caps', storeId, shiftRegisterId] });
          }
        }
      } catch {
        /* fall through */
      }
    }
    if (!id) {
      toast.error(t('cashRegisters.multikassa.needOpenShift'), { id: 'fiscal-drive-settings' });
      return;
    }
    setRegisterId(id);
    setOpen(true);
  };

  if (storeId == null) return null;

  const modalRegisterId = registerId ?? cashRegisterId;

  return (
    <>
      <div className={className || undefined}>
        <div className="pharmacy-pay-rail__mk-row pharmacy-pay-rail__fd-row">
          <button
            type="button"
            className={`pharmacy-pay-rail__mk pharmacy-pay-rail__mk--btn pharmacy-pay-rail__mk--${
              isFiscalDrive ? 'ok' : 'muted'
            }`}
            title={t('cashRegisters.fiscalDrive.openSettings')}
            onClick={openSettings}
          >
            {isLoading
              ? t('cashRegisters.multikassa.statusUnknown')
              : isFiscalDrive
                ? t('desktop.fiscalDriveActive')
                : t('desktop.fiscalDriveInactive')}
          </button>
          <button
            type="button"
            className="pharmacy-pay-rail__mk-settings"
            onClick={openSettings}
            title={t('cashRegisters.fiscalDrive.openSettings')}
            aria-label={t('cashRegisters.fiscalDrive.openSettings')}
          >
            <Cpu size={14} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>

      {open && modalRegisterId ? (
        <Suspense fallback={null}>
          <FiscalDriveSettingsModal
            open={open}
            cashRegisterId={modalRegisterId}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      ) : null}
    </>
  );
}
