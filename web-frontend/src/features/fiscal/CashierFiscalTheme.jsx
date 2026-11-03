import { useCashierStore } from '../../hooks/useCashierStore';
import { useCashierShiftView } from '../../hooks/useCashierShiftView';
import { useCashierStoreProfile } from '../../hooks/useCashierStoreProfile';
import CashierDesktopMenuFiscalDrive from '../cashier/components/desktop-menu/CashierDesktopMenuFiscalDrive';
import { useFiscalCashierStatus } from './useFiscalCashierStatus';
import './cashier-fiscal-theme.css';

/**
 * Lab-only: в меню кассы только FiscalDrive. Multikassa на эту сборку не показывается.
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
        <div className="cashier-fiscal-theme cashier-fiscal-theme--fiscal-drive" data-fiscal-theme="FISCAL_DRIVE">
        <CashierDesktopMenuFiscalDrive t={t} />
      </div>
    );
  }

  return null;
}
