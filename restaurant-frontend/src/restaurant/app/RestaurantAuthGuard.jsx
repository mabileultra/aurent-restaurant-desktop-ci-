import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isPlatformUser } from '../../utils/platformRoles';
import { redirectPlatformUserToMainApp } from '../../utils/redirectPlatformUser';

export default function RestaurantAuthGuard({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (isPlatformUser(user?.role)) {
    redirectPlatformUserToMainApp();
    return null;
  }
  return children;
}
