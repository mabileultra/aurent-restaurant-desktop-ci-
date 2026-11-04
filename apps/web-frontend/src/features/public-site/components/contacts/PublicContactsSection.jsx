import { useTranslation } from 'react-i18next';
import PublicLeadForm from '../PublicLeadForm';
import PublicContactsInfo from './PublicContactsInfo';
import { PUBLIC_CONTACTS_MEDIA } from '../../constants/publicSiteMedia';
import { PUBLIC_SITE_SECTIONS } from '../../constants/publicSiteSections';
import PublicLazyImage from '../shared/PublicLazyImage';
import PublicSectionTitle from '../shared/PublicSectionTitle';

export default function PublicContactsSection() {
  const { t } = useTranslation();

  return (
    <section className="public-contacts" id={PUBLIC_SITE_SECTIONS.contacts}>
      <div className="public-site-section">
        <PublicSectionTitle
          eyebrowKey="publicSite.contacts.eyebrow"
          titleKey="publicSite.contacts.title"
          leadKey="publicSite.contacts.subtitle"
        />
        <div className="public-contacts__panel">
          <div className="public-contacts__form">
            <h3 className="public-contacts__title">{t('publicSite.contacts.formTitle')}</h3>
            <p className="public-contacts__hint">{t('publicSite.contacts.formHint')}</p>
            <PublicLeadForm leadType="QUESTION" source="contacts" />
            <PublicContactsInfo />
          </div>
          <div className="public-contacts__photo">
            <PublicLazyImage
              src={PUBLIC_CONTACTS_MEDIA.image}
              srcSet={PUBLIC_CONTACTS_MEDIA.srcSet}
              alt={PUBLIC_CONTACTS_MEDIA.alt}
              sizes="(max-width: 900px) 100vw, 45vw"
            />
            <span className="public-contacts__badge">{t('publicSite.contacts.badge')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
