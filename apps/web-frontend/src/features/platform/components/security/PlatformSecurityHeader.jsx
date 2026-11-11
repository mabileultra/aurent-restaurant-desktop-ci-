import React from 'react';
import { UserPlus, Lock, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AaPageHeader from '../../../../components/aa/PageHeader';
import Button from '../../../../components/aa/Button';

export default function PlatformSecurityHeader({ onOpenCreateStaff, onGoToRules, onOpen2fa }) {
  const { t } = useTranslation();

  return (
    <AaPageHeader
      breadcrumbs={[
        { label: t('platform.security.breadcrumbControl', 'Boshqaruv') },
        { label: t('platform.security.nav', 'Xavfsizlik') },
      ]}
      title={t('platform.security.nav', 'Xavfsizlik')}
      meta={t('platform.security.title', 'Platforma xavfsizligi')}
      actions={(
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant="secondary"
            size="sm"
            icon={<Shield size={16} />}
            onClick={onOpen2fa}
          >
            {t('platform.security.setupMy2fa', 'Mening 2FA')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Lock size={16} />}
            onClick={onGoToRules}
          >
            {t('platform.security.tabs.rules', 'Kirish qoidalari')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus size={16} />}
            onClick={onOpenCreateStaff}
          >
            {t('platform.security.newStaffButton', 'Yangi xodim')}
          </Button>
        </div>
      )}
    />
  );
}
