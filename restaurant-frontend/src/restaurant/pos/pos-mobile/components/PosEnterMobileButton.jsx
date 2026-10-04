import { useTranslation } from 'react-i18next';
import { Smartphone } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';

/** Desktop header control — switch POS to phone shell. */
export default function PosEnterMobileButton({ onEnter, className = '' }) {
  const { t } = useTranslation();

  return (
    <BaseButton
      type="button"
      variant="ghost"
      className={['rst-pos-enter-mobile', className].filter(Boolean).join(' ')}
      title={t('rst.mobile.enter')}
      aria-label={t('rst.mobile.enter')}
      onClick={onEnter}
    >
      <Smartphone size={18} aria-hidden />
    </BaseButton>
  );
}
