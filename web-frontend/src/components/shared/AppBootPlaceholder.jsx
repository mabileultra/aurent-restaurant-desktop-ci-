import { isCashierPinLoginPath } from '../../utils/isCashierPinLoginPath';
import '../../styles/shared/app-boot-placeholder.css';

/** Placeholder while auth / desktop API bootstrap — never leave a blank dark void. */
export default function AppBootPlaceholder({ label = 'Aurent…' }) {
  const pinLogin = isCashierPinLoginPath();

  return (
    <div
      className={`app-boot-placeholder ${pinLogin ? 'app-boot-placeholder--pin' : 'app-boot-placeholder--dark'}`}
    >
      {label}
    </div>
  );
}
