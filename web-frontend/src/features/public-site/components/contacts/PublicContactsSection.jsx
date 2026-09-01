import { useTranslation } from 'react-i18next';
import PublicLeadForm from '../PublicLeadForm';
import { PUBLIC_CONTACTS_MEDIA } from '../../constants/publicSiteMedia';

export default function PublicContactsSection() {
  const { t } = useTranslation();

  return (
    <section className="public-contacts" id="contacts">
      <div className="public-site-section">
        <div className="public-contacts__panel">
          <div className="public-contacts__form">
            <h2 className="public-contacts__title">{t('publicSite.contacts.formTitle')}</h2>
            <p className="public-contacts__hint">{t('publicSite.contacts.formHint')}</p>
            <PublicLeadForm leadType="QUESTION" source="contacts" />
          </div>
          <div className="public-contacts__photo">
            <img
              src={PUBLIC_CONTACTS_MEDIA.image}
              alt={PUBLIC_CONTACTS_MEDIA.alt}
              loading="lazy"
              decoding="async"
            />
            <span className="public-contacts__badge">{t('publicSite.contacts.badge')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
