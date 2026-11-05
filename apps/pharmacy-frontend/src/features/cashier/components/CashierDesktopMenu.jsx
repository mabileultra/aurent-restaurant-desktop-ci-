import { useCashierDesktopMenu } from '../hooks/useCashierDesktopMenu';
import CashierDesktopMenuPanel from './desktop-menu/CashierDesktopMenuPanel';

export default function CashierDesktopMenu() {
  const menu = useCashierDesktopMenu();
  if (!menu) return null;
  return <CashierDesktopMenuPanel menu={menu} />;
}
