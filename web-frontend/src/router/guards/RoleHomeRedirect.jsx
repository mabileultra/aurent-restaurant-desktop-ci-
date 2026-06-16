import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { resolveRoleHomePath } from '../../utils/roleHomePath';

export default function RoleHomeRedirect() {
  const role = useAuthStore((s) => s.user?.role);
  return <Navigate to={resolveRoleHomePath(role)} replace />;
}
