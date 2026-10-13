import { Suspense, useState } from 'react';
import { lazyPage as lazy } from '../../../../router/lazyWithRetry';
import { Cpu } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCashierStore } from '../../../../hooks/useCashierStore';
import { useCashierShiftView } from '../../../../hooks/useCashierShiftView';
import { useCashierStoreProfile } from '../../../../hooks/useCashierStoreProfile';
import { useMultikassaCashierStatus } from '../../hooks/useMultikassaCashierStatus';

const FiscalDriveSettingsModal = lazy(() =>
  import('../../../cash-registers/components/FiscalDriveSettingsModal'),
);

/** Отдельный блок настроек FiscalDrive / ФМ 0400 в меню Desktop (не Multikassa). */
export default function CashierDesktopMenuFiscalDrive({ t }) {
  const { storeId } = useCashierStore();
  const { isPharmacy } = useCashierStoreProfile();
  const { shift } = useCashierShiftView(storeId, {
    catalogKind: isPharmacy ? 'pharmacy' : 'grocery',
  });
  const shiftRegisterId = shift?.cashRegisterId ?? null;
  const [open, setOpen] = useState(false);
  const { data: caps } = useMultikassaCashierStatus({
    storeId,
    cashRegisterId: shiftRegisterId,
    enabled: storeId != null,
  });
  const cashRegisterId = shiftRegisterId ?? caps?.cashRegisterId ?? null;
  const isFiscalDrive = String(caps?.fiscalProvider || '').toUpperCase() === 'FISCAL_DRIVE';

  if (storeId == null) return null;

  return (
    <>
      <div className="cashier-desktop-menu__connectivity">
        <div className="cashier-desktop-menu__section-label">{t('desktop.fiscalDriveSection')}</div>
        <p
          className={`cashier-desktop-menu__mk-status cashier-desktop-menu__mk-status--${
            isFiscalDrive ? 'ok' : 'muted'
          }`}
        >
          {isFiscalDrive
            ? t('desktop.fiscalDriveActive')
            : t('desktop.fiscalDriveInactive')}
        </p>
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          onClick={(e) => {
            e.stopPropagation();
            if (!cashRegisterId) {
              toast.error(t('cashRegisters.multikassa.needOpenShift'), { id: 'fiscal-drive-settings' });
              return;
            }
            setOpen(true);
          }}
        >
          <Cpu size={15} strokeWidth={2} aria-hidden />
          <span>{t('cashRegisters.fiscalDrive.openSettings')}</span>
        </button>
      </div>

      {open && cashRegisterId ? (
        <Suspense fallback={null}>
          <FiscalDriveSettingsModal
            open={open}
            cashRegisterId={cashRegisterId}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      ) : null}
    </>
  );
}
