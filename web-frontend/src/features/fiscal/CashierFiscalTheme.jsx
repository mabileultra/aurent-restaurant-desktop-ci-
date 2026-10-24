import { useCashierStore } from '../../hooks/useCashierStore';
import { useCashierShiftView } from '../../hooks/useCashierShiftView';
import { useCashierStoreProfile } from '../../hooks/useCashierStoreProfile';
import { FISCAL_PROVIDER } from '../../services/fiscal';
import CashierDesktopMenuFiscalDrive from '../cashier/components/desktop-menu/CashierDesktopMenuFiscalDrive';
import CashierDesktopMenuMultikassa from '../cashier/components/desktop-menu/CashierDesktopMenuMultikassa';
import { resolveCashierFiscalTheme } from './resolveCashierFiscalTheme';
import { useFiscalCashierStatus } from './useFiscalCashierStatus';
import './cashier-fiscal-theme.css';

/**
 * Фискалит один провайдер (XOR). В меню настроек оба входа — чтобы выбрать MK или FD.
 * На рейле оплаты блоки не монтируем.
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

  const theme = resolveCashierFiscalTheme(caps);
  const isDrive = theme === FISCAL_PROVIDER.FISCAL_DRIVE;

  if (variant === 'menu') {
    return (
      <div
        className={`cashier-fiscal-theme cashier-fiscal-theme--${isDrive ? 'fiscal-drive' : 'multikassa'}`}
        data-fiscal-theme={theme}
      >
        <CashierDesktopMenuMultikassa t={t} />
        <CashierDesktopMenuFiscalDrive t={t} />
      </div>
    );
  }

  return null;
}
