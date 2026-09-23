import { useCashierStore } from '../../hooks/useCashierStore';
import { useCashierStoreTypeQuery } from '../../hooks/useCashierStoreTypeQuery';
import { useAuthStore } from '../../store/authStore';
import { resolveCashierPostLoginPath } from '../../utils/cashierPostLoginPath';
import CashierSpaNavigate from './CashierSpaNavigate';

export default function CashierHomeRedirect() {
  const user = useAuthStore((s) => s.user);
  const { storeId } = useCashierStore();
  const { store, isPending, skipOnline, isError } = useCashierStoreTypeQuery(storeId);

  // Floor roles do not belong on aurent — retired /rst stub shows opaque deny.
  if (user?.role === 'WAITER' || user?.role === 'COOK') {
    return <CashierSpaNavigate to="/rst/pos" />;
  }

  if (storeId == null || skipOnline || isError || isPending) {
    return <CashierSpaNavigate to="/cashier/pos" />;
  }

  return (
    <CashierSpaNavigate
      to={resolveCashierPostLoginPath(user?.role, store?.businessType)}
    />
  );
}
