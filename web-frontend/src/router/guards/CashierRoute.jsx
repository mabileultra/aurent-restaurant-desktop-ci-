import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isDesktopCashier } from '../../utils/authLogin';

export default function CashierRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/cashier/login" replace />;
  if (user?.role !== 'CASHIER') {
    // Desktop app должен всегда работать через кассира (PIN). Если в storage остался ADMIN-токен,
    // кассовые эндпоинты вернут 403. Сбрасываем сессию и отправляем на PIN-login.
    if (isDesktopCashier()) {
      try {
        logout();
      } catch {
        /* ignore */
      }
      return (
        <Navigate
          to={`/cashier/login?${new URLSearchParams({ next: location.pathname }).toString()}`}
          replace
        />
      );
    }
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
