import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EMAIL_TAB_KEYS } from '../../utils/emailConstants';
import AaPageHeader from '../../../../components/aa/PageHeader';
import Button from '../../../../components/aa/Button';

export default function PlatformEmailHeader({ activeTab, onGoToSend }) {
  const { t } = useTranslation();
  const isHistory = activeTab === EMAIL_TAB_KEYS.HISTORY;

  return (
    <AaPageHeader
      breadcrumbs={[
        { label: t('platform.navGroups.management', 'Boshqaruv') },
        { label: t('platform.email.nav', 'Pochta') },
      ]}
      title={t('platform.email.nav', 'Pochta')}
      meta={t(
        'platform.email.subtitle',
        'Foydalanuvchilarga xabar yuborish, avtomatik xatlar va yetkazilish nazorati'
      )}
      actions={
        isHistory ? (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={onGoToSend}
          >
            {t('platform.email.newEmail', 'Yangi xabar')}
          </Button>
        ) : null
      }
    />
  );
}
