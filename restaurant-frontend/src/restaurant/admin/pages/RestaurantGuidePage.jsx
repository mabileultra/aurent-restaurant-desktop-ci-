import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import GuideToc from '../guide/GuideToc';
import { GuideSectionsList } from '../guide/GuideSection';
import { GUIDE_SECTIONS } from '../guide/guideSections';
import '../styles/guide-page.css';

function findScrollRoot(fromEl) {
  let node = fromEl?.parentElement ?? null;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const oy = style.overflowY;
    if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1) {
      return node;
    }
    node = node.parentElement;
  }
  return document.querySelector('.rst-shell__content') || document.scrollingElement || document.documentElement;
}

export default function RestaurantGuidePage() {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(GUIDE_SECTIONS[0].id);
  const lockRef = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    const nodes = GUIDE_SECTIONS
      .map((s) => document.getElementById(`guide-${s.id}`))
      .filter(Boolean);
    if (!nodes.length) return undefined;

    const root = findScrollRoot(pageRef.current);

    const observer = new IntersectionObserver(
      (entries) => {
        if (lockRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id.replace(/^guide-/, ''));
        }
      },
      { root: root === document.scrollingElement ? null : root, rootMargin: '-12% 0px -55% 0px', threshold: [0.12, 0.4, 0.65] },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => {
      observer.disconnect();
      if (lockRef.current) window.clearTimeout(lockRef.current);
    };
  }, []);

  const scrollTo = (id) => {
    setActiveId(id);
    const el = document.getElementById(`guide-${id}`);
    if (!el) return;

    if (lockRef.current) window.clearTimeout(lockRef.current);
    lockRef.current = window.setTimeout(() => {
      lockRef.current = null;
    }, 750);

    const root = findScrollRoot(pageRef.current);
    const rootTop = root === document.scrollingElement || root === document.documentElement
      ? 0
      : root.getBoundingClientRect().top;
    const offset = el.getBoundingClientRect().top - rootTop + (root.scrollTop || 0) - 88;
    root.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
  };

  return (
    <div className="rst-guide" ref={pageRef}>
      <header className="rst-guide__hero">
        <div className="rst-guide__hero-icon">
          <BookOpen size={22} aria-hidden />
        </div>
        <div>
          <h1 className="rst-coming__title">{t('rst.guide.title')}</h1>
          <p className="rst-coming__text mb-0">{t('rst.guide.subtitle')}</p>
        </div>
      </header>

      <p className="rst-guide__intro">{t('rst.guide.intro')}</p>
      <GuideToc t={t} activeId={activeId} onSelect={scrollTo} />

      <div className="rst-guide__main">
        <GuideSectionsList t={t} />
      </div>
    </div>
  );
}
