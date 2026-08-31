import { useTranslation } from 'react-i18next';
import PublicSitePageShell from '../components/PublicSitePageShell';
import PublicLeadForm from '../components/PublicLeadForm';

export default function PublicEquipmentPage() {
  const { t } = useTranslation();

  return (
    <PublicSitePageShell>
      <section className="public-static-page__hero">
        <p className="public-static-page__eyebrow">{t('publicSite.equipment.eyebrow')}</p>
        <h1 className="public-static-page__title">{t('publicSite.equipment.title')}</h1>
        <p className="public-static-page__lead">{t('publicSite.equipment.subtitle')}</p>
      </section>
      <section className="public-static-page__content">
        <div className="public-static-page__cards">
          {['fiscal', 'scanner', 'scale', 'terminal'].map((item) => (
            <article key={item} className="public-static-page__card">
              <h2>{t(`publicSite.equipment.items.${item}.title`)}</h2>
              <p>{t(`publicSite.equipment.items.${item}.desc`)}</p>
            </article>
          ))}
        </div>
        <div className="public-static-page__panel">
          <h2 className="public-static-page__panel-title">{t('publicSite.equipment.formTitle')}</h2>
          <PublicLeadForm leadType="EQUIPMENT" source="equipment" compact />
        </div>
      </section>
    </PublicSitePageShell>
  );
}
