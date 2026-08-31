import { useTranslation } from 'react-i18next';
import PublicSitePageShell from '../components/PublicSitePageShell';
import PublicLeadForm from '../components/PublicLeadForm';

export default function ContactsPage() {
  const { t } = useTranslation();

  return (
    <PublicSitePageShell>
      <section className="public-static-page__hero">
        <p className="public-static-page__eyebrow">{t('publicSite.contacts.eyebrow')}</p>
        <h1 className="public-static-page__title">{t('publicSite.contacts.title')}</h1>
        <p className="public-static-page__lead">{t('publicSite.contacts.subtitle')}</p>
      </section>

      <section className="public-static-page__content public-static-page__content--split">
        <div className="public-static-page__panel">
          <h2 className="public-static-page__panel-title">{t('publicSite.contacts.formTitle')}</h2>
          <p className="public-static-page__panel-text">{t('publicSite.contacts.formHint')}</p>
          <PublicLeadForm leadType="QUESTION" source="contacts" />
        </div>
        <aside className="public-static-page__aside">
          <h2 className="public-static-page__panel-title">{t('publicSite.contacts.infoTitle')}</h2>
          <ul className="public-static-page__info-list">
            <li>
              <span>{t('publicSite.contacts.phoneLabel')}</span>
              <strong>{t('publicSite.contacts.phoneValue')}</strong>
            </li>
            <li>
              <span>{t('publicSite.contacts.emailLabel')}</span>
              <strong>{t('publicSite.contacts.emailValue')}</strong>
            </li>
            <li>
              <span>{t('publicSite.contacts.hoursLabel')}</span>
              <strong>{t('publicSite.contacts.hoursValue')}</strong>
            </li>
          </ul>
        </aside>
      </section>
    </PublicSitePageShell>
  );
}
