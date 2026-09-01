import { Clock, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PublicHeroSupport() {
  const { t } = useTranslation();

  return (
    <div className="public-hero-support">
      <div className="public-hero-support__item">
        <Headphones size={18} aria-hidden />
        <span>{t('publicSite.homePage.support247')}</span>
      </div>
      <div className="public-hero-support__item">
        <Clock size={18} aria-hidden />
        <span>{t('publicSite.homePage.salesHours')}</span>
      </div>
    </div>
  );
}
