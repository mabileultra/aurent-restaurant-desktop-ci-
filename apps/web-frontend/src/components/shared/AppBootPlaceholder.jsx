import { isCashierPinLoginPath } from '../../utils/isCashierPinLoginPath';
import '../../styles/shared/app-boot-placeholder.css';

import Spinner from '../ui/Spinner';

/** Placeholder while auth / desktop API bootstrap — never leave a blank dark void. */
export default function AppBootPlaceholder({ label = 'Aurent…', tone }) {
  const pinLogin = isCashierPinLoginPath();
  const isDocDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const resolvedTone = tone || (pinLogin ? 'light' : (isDocDark ? 'dark' : 'light'));

  const toneClass = resolvedTone === 'dark'
    ? 'app-boot-placeholder--dark'
    : 'app-boot-placeholder--light';

  return (
    <div className={`app-boot-placeholder ${toneClass}`}>
      <Spinner size="xl" text={label} variant="emerald" />
    </div>
  );
}
