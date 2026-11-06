import { useTranslation } from 'react-i18next';
import { useRestaurantWorkspaceStore } from '../shared/hooks/useRestaurantWorkspaceStore';
import { useRestaurantPrintRelay } from '../pos/hooks/useRestaurantPrintRelay';
import { isDesktopPrinter } from '../pos/utils/desktopPrinters';

const EMPTY_WAITERS = new Map();

/**
 * Desktop-only: keep print-job polling alive on any /rst screen (admin, POS, kitchen).
 * Business rule unchanged — jobs still run only on the Aurent desktop with printers.
 */
export default function RestaurantDesktopPrintHost() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const storeId = isDesktopPrinter() ? workspace.storeId : null;
  useRestaurantPrintRelay(storeId, t, EMPTY_WAITERS);
  return null;
}
