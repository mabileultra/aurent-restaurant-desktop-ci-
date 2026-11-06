import BookingWorkspace from '../../shared/components/BookingWorkspace';
import { useAuthStore } from '../../../store/authStore';
import { resolveFloorAccess } from '../../pos/utils/floorRoleAccess';

export default function BookingAdminPage() {
  const role = useAuthStore((s) => s.user?.role);
  const access = resolveFloorAccess(role);
  return (
    <BookingWorkspace
      access={{
        canCreate: access.canCreateBooking,
        canManage: access.canManageBooking,
      }}
    />
  );
}
