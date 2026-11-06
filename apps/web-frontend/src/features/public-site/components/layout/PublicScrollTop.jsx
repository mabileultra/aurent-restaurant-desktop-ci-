import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { scrollToPublicSection } from '../../hooks/usePublicHashScroll';

export default function PublicScrollTop() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="public-scroll-top"
      onClick={() => scrollToPublicSection('#top')}
      aria-label={t('publicSite.scrollTop')}
    >
      <ArrowUp size={20} aria-hidden />
    </button>
  );
}
