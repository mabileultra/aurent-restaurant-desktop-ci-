import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PublicFloatingChat() {
  const { t } = useTranslation();

  return (
    <Link to="/contacts" className="public-floating-chat" aria-label={t('publicSite.chat.label')}>
      <MessageCircle className="public-floating-chat__icon" aria-hidden />
      <span>{t('publicSite.chat.label')}</span>
    </Link>
  );
}
