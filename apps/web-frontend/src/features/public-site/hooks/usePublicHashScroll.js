import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PUBLIC_SITE_SECTIONS } from '../constants/publicSiteSections';

function headerOffset() {
  const header = document.querySelector('.public-site-header');
  return (header?.offsetHeight ?? 68) + 8;
}

export function scrollToPublicSection(hash, behavior = 'smooth') {
  if (!hash) return;
  const id = hash.startsWith('#') ? hash.slice(1) : hash;

  if (id === PUBLIC_SITE_SECTIONS.top) {
    window.scrollTo({ top: 0, behavior });
    return;
  }

  const el = document.getElementById(id);
  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY - headerOffset();
  window.scrollTo({ top, behavior });
}

export default function usePublicHashScroll() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (pathname !== '/' || !hash) return undefined;

    const frame = requestAnimationFrame(() => {
      scrollToPublicSection(hash, 'auto');
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
}
