import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { findRstAdminNav } from '../../app/restaurantAdminNav';
import '../../shared/styles/rst-blocks.css';

export default function RestaurantComingSoonPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const item = findRstAdminNav(location.pathname);
  const title = item ? t(`rst.nav.${item.key}`) : t('rst.admin.comingSoon');

  return (
    <section className="rst-coming">
      <h1 className="rst-coming__title">{title}</h1>
      <p className="rst-coming__text">
        {t('rst.admin.comingSoonText', { stage: item?.stage ?? '—' })}
      </p>
    </section>
  );
}
