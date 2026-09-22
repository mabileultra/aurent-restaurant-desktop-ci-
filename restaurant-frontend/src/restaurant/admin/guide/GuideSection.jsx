import {
  guideLeadKey,
  guideNotesKey,
  guideStepsKey,
  guideTitleKey,
  GUIDE_SECTIONS,
} from './guideSections';
import GuideSectionIcon from './GuideSectionIcon';

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}

export default function GuideSection({ id, icon, index, t }) {
  const steps = asList(t(guideStepsKey(id), { returnObjects: true }));
  const notes = asList(t(guideNotesKey(id), { returnObjects: true }));

  return (
    <section id={`guide-${id}`} className="rst-guide__section">
      <header className="rst-guide__section-head">
        <span className="rst-guide__section-badge">{index + 1}</span>
        <div className="rst-guide__section-icon">
          <GuideSectionIcon name={icon} size={20} />
        </div>
        <div>
          <h2 className="rst-guide__section-title">{t(guideTitleKey(id))}</h2>
          <p className="rst-guide__section-lead">{t(guideLeadKey(id))}</p>
        </div>
      </header>

      {steps.length > 0 ? (
        <ol className="rst-guide__steps">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}

      {notes.length > 0 ? (
        <ul className="rst-guide__notes">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function GuideSectionsList({ t }) {
  return (
    <div className="rst-guide__sections">
      {GUIDE_SECTIONS.map((section, index) => (
        <GuideSection
          key={section.id}
          id={section.id}
          icon={section.icon}
          index={index}
          t={t}
        />
      ))}
    </div>
  );
}
