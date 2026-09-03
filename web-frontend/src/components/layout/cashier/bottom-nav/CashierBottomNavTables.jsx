import { UtensilsCrossed } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCashierStoreProfile } from '../../../../hooks/useCashierStoreProfile';
import { usePosShell } from '../../../../contexts/PosShellContext';
import { isCashierRegisterScreen } from '../../../../utils/cashierRegisterRoute';
import { bottomNavLinkClass } from './bottomNavClass';

export default function CashierBottomNavTables({ t }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { registerPath } = useCashierStoreProfile();
  const { shell } = usePosShell() ?? {};
  const onRegisterScreen = isCashierRegisterScreen(location.pathname);
  const isTablesActive = onRegisterScreen && shell?.posPane === 'tables' && !shell?.payOpen;

  const openTables = () => {
    if (registerPath.startsWith('/rst/')) {
      navigate(registerPath);
      return;
    }
    if (onRegisterScreen && shell) {
      shell.onClosePayment?.();
      shell.onGoToTables?.();
      return;
    }
    navigate(registerPath, { state: { pane: 'tables' } });
  };

  return (
    <button
      type="button"
      className={bottomNavLinkClass(isTablesActive, { primary: true })}
      onClick={openTables}
      title={t('restaurantCashier.navTables')}
    >
      <UtensilsCrossed size={22} strokeWidth={2} aria-hidden />
      <span>{t('restaurantCashier.navTables')}</span>
    </button>
  );
}
