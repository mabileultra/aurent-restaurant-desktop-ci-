import { GUIDE_SECTIONS, guideTitleKey } from './guideSections';
import '../styles/guide-page.css';

export default function GuideToc({ t, activeId, onSelect }) {
  return (
    <nav className="rst-guide__toc" aria-label={t('rst.guide.tocLabel')}>
      <p className="rst-guide__toc-title">{t('rst.guide.tocTitle')}</p>
      <ol className="rst-guide__toc-list">
        {GUIDE_SECTIONS.map((section, index) => (
          <li key={section.id}>
            <button
              type="button"
              className={`rst-guide__toc-btn${activeId === section.id ? ' is-active' : ''}`}
              onClick={() => onSelect(section.id)}
            >
              <span className="rst-guide__toc-num">{index + 1}</span>
              <span>{t(guideTitleKey(section.id))}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
