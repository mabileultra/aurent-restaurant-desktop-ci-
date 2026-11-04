import { useTranslation } from 'react-i18next';
import {
  PUBLIC_SITE_EMAIL,
  PUBLIC_SITE_EMAIL_HREF,
  PUBLIC_SITE_PHONE,
  PUBLIC_SITE_PHONE_HREF,
} from '../../constants/publicSiteMedia';

export default function PublicContactsInfo() {
  const { t } = useTranslation();

  return (
    <div className="public-contacts__info">
      <h3 className="public-contacts__info-title">{t('publicSite.contacts.infoTitle')}</h3>
      <ul className="public-contacts__info-list">
        <li>
          <span className="public-contacts__info-label">{t('publicSite.contacts.phoneLabel')}</span>
          <a href={PUBLIC_SITE_PHONE_HREF} className="public-contacts__info-value">
            {PUBLIC_SITE_PHONE}
          </a>
        </li>
        <li>
          <span className="public-contacts__info-label">{t('publicSite.contacts.emailLabel')}</span>
          <a href={PUBLIC_SITE_EMAIL_HREF} className="public-contacts__info-value">
            {PUBLIC_SITE_EMAIL}
          </a>
        </li>
        <li>
          <span className="public-contacts__info-label">{t('publicSite.contacts.hoursLabel')}</span>
          <span className="public-contacts__info-value">{t('publicSite.contacts.hoursValue')}</span>
        </li>
      </ul>
    </div>
  );
}
