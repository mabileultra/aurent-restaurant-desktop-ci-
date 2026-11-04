import { useEffect } from 'react';
import {
  VIEWPORT_HTML_CLASSES,
  resolveViewportProfile,
} from '../../utils/viewportBreakpoints';

function applyViewportClasses(width, height) {
  const root = document.documentElement;
  const profile = resolveViewportProfile(width, height);
  root.classList.toggle('app-viewport--compact', profile.compact);
  root.classList.toggle('app-viewport--desktop', profile.desktop);
  root.classList.toggle('app-viewport--canonical', profile.canonical);
}

/** Ставит профили адаптивности на <html> для токенов spacing/touch. */
export default function AppViewportSync() {
  useEffect(() => {
    const sync = () => applyViewportClasses(window.innerWidth, window.innerHeight);
    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      VIEWPORT_HTML_CLASSES.forEach((cls) => {
        document.documentElement.classList.remove(cls);
      });
    };
  }, []);

  return null;
}
