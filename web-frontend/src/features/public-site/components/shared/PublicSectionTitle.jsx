import { useTranslation } from 'react-i18next';

export default function PublicSectionTitle({ eyebrowKey, titleKey, leadKey, id }) {
  const { t } = useTranslation();

  return (
    <header className="public-section__head" id={id}>
      {eyebrowKey ? <p className="public-section__eyebrow">{t(eyebrowKey)}</p> : null}
      <h2 className="public-section__title">{t(titleKey)}</h2>
      {leadKey ? <p className="public-section__lead">{t(leadKey)}</p> : null}
    </header>
  );
}
