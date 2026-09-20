import { useEffect, useState } from 'react';
import { resolveViewportProfile } from '../utils/viewportBreakpoints';

function readProfile() {
  if (typeof window === 'undefined') {
    return { compact: false, desktop: true, canonical: false };
  }
  return resolveViewportProfile(window.innerWidth, window.innerHeight);
}

/** React-доступ к текущему viewport-профилю (синхронно с AppViewportSync). */
export function useViewportProfile() {
  const [profile, setProfile] = useState(readProfile);

  useEffect(() => {
    const onResize = () => setProfile(readProfile());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  return profile;
}
