import { useCashierStore } from '../../hooks/useCashierStore';
import { useCashierShiftView } from '../../hooks/useCashierShiftView';
import { useCashierStoreProfile } from '../../hooks/useCashierStoreProfile';
import CashierDesktopMenuMultikassa from '../cashier/components/desktop-menu/CashierDesktopMenuMultikassa';
import { useFiscalCashierStatus } from './useFiscalCashierStatus';
import './cashier-fiscal-theme.css';

/**
 * FiscalDrive временно скрыт с кассы. Меню — только Multikassa. Рейл оплаты без выключателей.
 */
export default function CashierFiscalTheme({ variant = 'rail', t }) {
  const { storeId } = useCashierStore();
  const { isPharmacy } = useCashierStoreProfile();
  const { shift } = useCashierShiftView(storeId, {
    catalogKind: isPharmacy ? 'pharmacy' : 'grocery',
  });
  const cashRegisterId = shift?.cashRegisterId ?? null;
  const { data: caps, isLoading } = useFiscalCashierStatus({
    storeId,
    cashRegisterId,
    enabled: storeId != null,
  });

  if (storeId == null || (isLoading && !caps)) return null;

  if (variant === 'menu') {
    return (
      <div className="cashier-fiscal-theme cashier-fiscal-theme--multikassa" data-fiscal-theme="MULTIKASSA">
        <CashierDesktopMenuMultikassa t={t} />
      </div>
    );
  }

  return null;
}
