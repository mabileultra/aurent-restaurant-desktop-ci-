import { useEffect, useState } from 'react';
import { VIEWPORT_MEDIA } from '../utils/viewportBreakpoints';

function readProfile() {
  if (typeof window === 'undefined') {
    return { compact: false, desktop: false, canonical: false };
  }
  return {
    compact: window.matchMedia(VIEWPORT_MEDIA.compact).matches,
    desktop: window.matchMedia(VIEWPORT_MEDIA.desktop).matches,
    canonical: window.matchMedia(VIEWPORT_MEDIA.canonical).matches,
  };
}

const HTML_CLASS = {
  compact: 'app-viewport--compact',
  desktop: 'app-viewport--desktop',
  canonical: 'app-viewport--canonical',
};

/**
 * Глобальный профиль viewport — классы на <html> для всех оболочек
 * (admin, platform, cashier, pharmacy, restaurant).
 */
export function useAppViewportProfile() {
  const [profile, setProfile] = useState(readProfile);

  useEffect(() => {
    const queries = [
      ['compact', VIEWPORT_MEDIA.compact],
      ['desktop', VIEWPORT_MEDIA.desktop],
      ['canonical', VIEWPORT_MEDIA.canonical],
    ].map(([key, media]) => [key, window.matchMedia(media)]);

    const sync = () => {
      const next = {
        compact: queries[0][1].matches,
        desktop: queries[1][1].matches,
        canonical: queries[2][1].matches,
      };
      setProfile(next);

      const root = document.documentElement;
      root.classList.toggle(HTML_CLASS.compact, next.compact);
      root.classList.toggle(HTML_CLASS.desktop, next.desktop);
      root.classList.toggle(HTML_CLASS.canonical, next.canonical);
    };

    sync();
    queries.forEach(([, mq]) => mq.addEventListener('change', sync));
    return () => {
      queries.forEach(([, mq]) => mq.removeEventListener('change', sync));
      const root = document.documentElement;
      root.classList.remove(HTML_CLASS.compact, HTML_CLASS.desktop, HTML_CLASS.canonical);
    };
  }, []);

  return profile;
}
