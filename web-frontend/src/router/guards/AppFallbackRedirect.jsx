import { Navigate } from 'react-router-dom';
import { cashierLoginPath, isDesktopCashier } from '../../utils/authLogin';

export default function AppFallbackRedirect() {
  const to = isDesktopCashier() ? cashierLoginPath() : '/';
  return <Navigate to={to} replace />;
}
