import { useEffect, useState } from 'react';
import { useHallLanFailover } from './useHallLanFailover';
import HallLanSwitchBanner from './components/HallLanSwitchBanner';

/** Cloud phones only: hall PC lost internet → CTA to switch to LAN. */
export default function HallLanFailoverHost() {
  const { show, primaryHref, lanHubUrls } = useHallLanFailover();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!show) setDismissed(false);
  }, [show]);

  if (!show || dismissed) return null;

  return (
    <HallLanSwitchBanner
      primaryHref={primaryHref}
      lanHubUrls={lanHubUrls}
      onDismiss={() => setDismissed(true)}
    />
  );
}
