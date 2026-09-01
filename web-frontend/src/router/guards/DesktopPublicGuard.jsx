import { Navigate } from 'react-router-dom';
import { cashierLoginPath, isDesktopCashier } from '../../utils/authLogin';

/** В desktop-кассе публичный лендинг недоступен — только вход в кассу/админку. */
export default function DesktopPublicGuard({ children }) {
  if (isDesktopCashier()) {
    return <Navigate to={cashierLoginPath()} replace />;
  }
  return children;
}
