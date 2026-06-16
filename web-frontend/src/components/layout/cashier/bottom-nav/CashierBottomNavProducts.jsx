import { Package } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePosShell } from '../../../../contexts/PosShellContext';
import { bottomNavLinkClass } from './bottomNavClass';

export default function CashierBottomNavProducts({ t }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { shell } = usePosShell() ?? {};
  const onPosPage = location.pathname.startsWith('/cashier/pos');
  const isCatalogActive = onPosPage && shell?.posPane === 'catalog' && !shell?.payOpen;

  const openCatalog = () => {
    if (onPosPage && shell && !shell.payOpen) {
      shell.onGoToCatalog();
      return;
    }
    navigate('/cashier/pos', { state: { pane: 'catalog' } });
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
