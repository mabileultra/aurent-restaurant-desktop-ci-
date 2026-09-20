import { useCashierStore } from '../../hooks/useCashierStore';
import { useCashierStoreTypeQuery } from '../../hooks/useCashierStoreTypeQuery';
import { useAuthStore } from '../../store/authStore';
import { resolveCashierPostLoginPath } from '../../utils/cashierPostLoginPath';
import CashierSpaNavigate from './CashierSpaNavigate';

export default function CashierHomeRedirect() {
  const user = useAuthStore((s) => s.user);
  const { storeId } = useCashierStore();
  const { store, isPending, skipOnline, isError } = useCashierStoreTypeQuery(storeId);

  if (user?.role === 'WAITER' || user?.role === 'COOK') {
    return <CashierSpaNavigate to={resolveCashierPostLoginPath(user.role)} />;
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
