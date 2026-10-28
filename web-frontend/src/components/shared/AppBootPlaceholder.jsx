import { isCashierPinLoginPath } from '../../utils/isCashierPinLoginPath';
import '../../styles/shared/app-boot-placeholder.css';

import Spinner from '../ui/Spinner';

/** Placeholder while auth / desktop API bootstrap — never leave a blank dark void. */
export default function AppBootPlaceholder({ label = 'Aurent POS…' }) {
  const pinLogin = isCashierPinLoginPath();

  return (
    <div
      className={`app-boot-placeholder ${pinLogin ? 'app-boot-placeholder--pin' : 'app-boot-placeholder--dark'}`}
    >
      <Spinner size="xl" text={label} variant="emerald" />
    </div>
  );
}
