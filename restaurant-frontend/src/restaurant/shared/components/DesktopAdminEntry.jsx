import { adminLoginPath, isDesktopCashier } from '../../../utils/authLogin';
import { logoutAndResetSession } from '../../../utils/authSession';
import '../styles/desktop-admin-entry.css';

/** Separate admin sign-in on the desktop cashier/waiter, not mixed with logout. */
export default function DesktopAdminEntry({ label }) {
  if (!isDesktopCashier()) return null;

  return (
    <button
      type="button"
      className="rst-desktop-admin"
      onClick={() => {
        logoutAndResetSession();
        window.location.assign(adminLoginPath());
      }}
    >
      {label}
    </button>
  );
}
