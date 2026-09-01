import { useTranslation } from 'react-i18next';
import PublicSitePageShell from '../components/PublicSitePageShell';
import PublicLeadForm from '../components/PublicLeadForm';
import PublicSectionTitle from '../components/shared/PublicSectionTitle';
import { PUBLIC_SITE_EMAIL, PUBLIC_SITE_PHONE, PUBLIC_SITE_PHONE_HREF } from '../constants/publicSiteMedia';

export default function ContactsPage() {
  const { t } = useTranslation();

  return (
    <PublicSitePageShell>
      <div className="public-page-hero">
        <PublicSectionTitle
          eyebrowKey="publicSite.contacts.eyebrow"
          titleKey="publicSite.contacts.title"
          leadKey="publicSite.contacts.subtitle"
        />
      </div>
      <div className="public-page-content public-page-content--split">
        <div className="public-panel">
          <h2 className="public-panel__title">{t('publicSite.contacts.formTitle')}</h2>
          <p className="public-panel__text">{t('publicSite.contacts.formHint')}</p>
          <PublicLeadForm leadType="QUESTION" source="contacts" />
        </div>
        <aside className="public-panel">
          <h2 className="public-panel__title">{t('publicSite.contacts.infoTitle')}</h2>
          <ul className="public-info-list">
            <li>
              <span>{t('publicSite.contacts.phoneLabel')}</span>
              <strong>
                <a href={PUBLIC_SITE_PHONE_HREF}>{PUBLIC_SITE_PHONE}</a>
              </strong>
            </li>
            <li>
              <span>{t('publicSite.contacts.emailLabel')}</span>
              <strong>
                <a href={`mailto:${PUBLIC_SITE_EMAIL}`}>{PUBLIC_SITE_EMAIL}</a>
              </strong>
            </li>
            <li>
              <span>{t('publicSite.contacts.hoursLabel')}</span>
              <strong>{t('publicSite.contacts.hoursValue')}</strong>
            </li>
          </ul>
        </aside>
      </div>
    </PublicSitePageShell>
  );
}
