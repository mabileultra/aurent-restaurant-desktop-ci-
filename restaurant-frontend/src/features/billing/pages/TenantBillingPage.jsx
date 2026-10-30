import { useTranslation } from 'react-i18next';
import { isRestaurantDesktop } from '../../../utils/restaurantDesktop';
import RestaurantSectionPlaceholder from '../../../stubs/RestaurantSectionPlaceholder';

/**
 * Hall PC: billing is cloud SaaS only — never invent invoices offline.
 * Web restaurant admin can grow a real billing UI later; desktop stays honest stub.
 */
export default function TenantBillingPage({ variant }) {
  const { t } = useTranslation();
  const hallPc = isRestaurantDesktop() || variant === 'restaurant';

  return (
    <RestaurantSectionPlaceholder
      title={t('rst.billing.title', { defaultValue: 'Биллинг' })}
      hint={
        hallPc
          ? t('rst.billing.hallPcHint', {
              defaultValue:
                'Подписка и счета — на r-aurent.uz. На этом ПК зала биллинг не ведётся; доступ к залу не блокируется.',
            })
          : t('rst.billing.webHint', {
              defaultValue: 'Раздел биллинга ресторана. Основной фронт аптеки не используем.',
            })
      }
    />
  );
}
