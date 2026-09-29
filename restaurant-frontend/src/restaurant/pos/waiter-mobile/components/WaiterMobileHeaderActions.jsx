import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserRound } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';
import { logoutAndResetSession } from '../../../../utils/authSession';
import WaiterProfilePanel from '../components/WaiterProfilePanel';
import { useWaiterFullscreen } from '../hooks/useWaiterFullscreen';
import { useWaiterPwaInstall } from '../hooks/useWaiterPwaInstall';

/**
 * Compact header actions for waiter mobile: profile entry only.
 * Theme / language / logout / fullscreen live inside the profile sheet.
 */
export default function WaiterMobileHeaderActions({
  enabled,
  displayName,
  storeName,
  roleLabel,
  canAdmin = false,
  showExitMobile,
  onExitMobile,
}) {
  const { t } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const fullscreen = useWaiterFullscreen({ enabled });
  const pwa = useWaiterPwaInstall({ enabled });

  useEffect(() => {
    if (!enabled || !profileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [enabled, profileOpen]);

  if (!enabled) return null;

  return (
    <>
      <BaseButton
        type="button"
        variant="ghost"
        className="rst-waiter-profile-trigger"
        aria-haspopup="dialog"
        aria-expanded={profileOpen}
        onClick={() => setProfileOpen(true)}
      >
        <UserRound size={18} aria-hidden />
        {t('rst.waiter.profile.title')}
      </BaseButton>

      <WaiterProfilePanel
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        displayName={displayName}
        storeName={storeName}
        roleLabel={roleLabel}
        canAdmin={canAdmin}
        fullscreenPreferred={fullscreen.preferred}
        fullscreenSupported={fullscreen.supported}
        onFullscreenChange={fullscreen.setFullscreenPreferred}
        showExitMobile={showExitMobile}
        onExitMobile={onExitMobile}
        pwa={pwa}
        onLogout={() => logoutAndResetSession()}
      />
    </>
  );
}
