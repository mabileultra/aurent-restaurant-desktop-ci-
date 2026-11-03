import { useRestaurantDesktopNotifications } from '../hooks/useRestaurantDesktopNotifications';
import RestaurantDesktopNotificationModal from './RestaurantDesktopNotificationModal';

/** Mount once under authenticated restaurant shell. */
export default function RestaurantDesktopNotificationsHost() {
  const { active, dismissActive } = useRestaurantDesktopNotifications();
  return (
    <RestaurantDesktopNotificationModal
      item={active}
      onOk={dismissActive}
      okLabel="OK"
    />
  );
}
