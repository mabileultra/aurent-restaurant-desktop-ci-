import { isCashierPinLoginPath } from '../../utils/isCashierPinLoginPath';
import '../../styles/shared/app-boot-placeholder.css';

/** Placeholder while auth / desktop API bootstrap — never leave a blank dark void. */
export default function AppBootPlaceholder({ label = 'Aurent…', tone }) {
  const pinLogin = isCashierPinLoginPath();
  const resolvedTone = tone || (pinLogin ? 'pin' : 'dark');

  return (
    <div
      className={`app-boot-placeholder ${
        resolvedTone === 'pin' || resolvedTone === 'light'
          ? 'app-boot-placeholder--pin'
          : 'app-boot-placeholder--dark'
      }`}
    >
      {label}
    </div>
  );
}
