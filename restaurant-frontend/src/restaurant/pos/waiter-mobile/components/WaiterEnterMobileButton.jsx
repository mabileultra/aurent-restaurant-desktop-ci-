import { useTranslation } from 'react-i18next';
import { Smartphone } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';

/** Desktop header control — switch floor POS to phone shell. */
export default function WaiterEnterMobileButton({ onEnter }) {
  const { t } = useTranslation();

  return (
    <BaseButton
      type="button"
      variant="ghost"
      className="rst-waiter-enter-mobile"
      title={t('rst.waiter.profile.enterMobile')}
      aria-label={t('rst.waiter.profile.enterMobile')}
      onClick={onEnter}
    >
      <Smartphone size={18} aria-hidden />
    </BaseButton>
  );
}
