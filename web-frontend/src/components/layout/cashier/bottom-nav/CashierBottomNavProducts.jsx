import { Package } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCashierStoreProfile } from '../../../../hooks/useCashierStoreProfile';
import { usePosShell } from '../../../../contexts/PosShellContext';
import { isCashierRegisterScreen } from '../../../../utils/cashierRegisterRoute';
import { bottomNavLinkClass } from './bottomNavClass';

export default function CashierBottomNavProducts({ t }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { registerPath } = useCashierStoreProfile();
  const { shell } = usePosShell() ?? {};
  const onRegisterScreen = isCashierRegisterScreen(location.pathname);
  const isCatalogActive = onRegisterScreen && shell?.posPane === 'catalog' && !shell?.payOpen;

  const openCatalog = () => {
    if (onRegisterScreen && shell && !shell.payOpen) {
      shell.onGoToCatalog();
      return;
    }
    navigate(registerPath, { state: { pane: 'catalog' } });
  };

  return (
    <button
      type="button"
      className={bottomNavLinkClass(isCatalogActive, { primary: true })}
      onClick={openCatalog}
      title={t('pos.tabCatalog')}
    >
      <Package size={28} strokeWidth={2} aria-hidden />
      <span>{t('pos.tabCatalog')}</span>
    </button>
  );
}
