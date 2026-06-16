import { ScanLine } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePosShell } from '../../../../contexts/PosShellContext';
import { bottomNavLinkClass } from './bottomNavClass';

export default function CashierBottomNavRegister({ t }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { shell } = usePosShell() ?? {};
  const onPosPage = location.pathname.startsWith('/cashier/pos');
  const isRegisterActive = onPosPage && shell?.posPane === 'register' && !shell?.payOpen;

  const openRegister = () => {
    if (onPosPage && shell) {
      shell.onClosePayment?.();
      shell.onGoToRegister?.();
      return;
    }
    navigate('/cashier/pos', { state: { pane: 'register' } });
  };

  return (
    <button
      type="button"
      className={bottomNavLinkClass(isRegisterActive, { primary: true })}
      onClick={openRegister}
      title={t('pos.navSale')}
    >
      <ScanLine size={28} strokeWidth={2} aria-hidden />
      <span>{t('pos.navSale')}</span>
    </button>
  );
}
