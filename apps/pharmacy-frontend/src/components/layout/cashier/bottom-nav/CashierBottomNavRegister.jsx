import { ScanSearch } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCashierStoreProfile } from '../../../../hooks/useCashierStoreProfile';
import { usePosShell } from '../../../../contexts/PosShellContext';
import { bottomNavLinkClass } from './bottomNavClass';
import { isPharmPosPath } from '../../../../pharmacy/app/pharmacyPaths';

export default function CashierBottomNavRegister({ t }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { registerPath } = useCashierStoreProfile();
  const { shell } = usePosShell() ?? {};
  const onRegisterPage =
    location.pathname.startsWith('/cashier/pos')
    || isPharmPosPath(location.pathname);
  const isRegisterActive = onRegisterPage && shell?.posPane === 'register' && !shell?.payOpen;

  const openRegister = () => {
    if (location.pathname === registerPath) {
      if (onRegisterPage && shell) {
        shell.onClosePayment?.();
        shell.onGoToRegister?.();
      }
      return;
    }
    if (onRegisterPage && shell) {
      shell.onClosePayment?.();
      shell.onGoToRegister?.();
      return;
    }
    navigate(registerPath, { state: { pane: 'register' } });
  };

  return (
    <button
      type="button"
      className={`${bottomNavLinkClass(isRegisterActive, { primary: true })} cashier-bottom-nav__btn--register`}
      onClick={openRegister}
      title={t('pos.navSale')}
    >
      <ScanSearch size={20} strokeWidth={2} aria-hidden />
      <span>{t('pos.navSale')}</span>
    </button>
  );
}
