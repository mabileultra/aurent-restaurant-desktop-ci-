import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isPlatformUser } from '../../utils/platformRoles';
import { redirectPlatformUserToMainApp } from '../../utils/redirectPlatformUser';
import { unauthenticatedLoginPath } from '../../utils/authLogin';

export default function RestaurantAuthGuard({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to={unauthenticatedLoginPath(location.pathname)} replace />;
  }
  if (isPlatformUser(user?.role)) {
    redirectPlatformUserToMainApp();
    return null;
  }
  return children;
}
