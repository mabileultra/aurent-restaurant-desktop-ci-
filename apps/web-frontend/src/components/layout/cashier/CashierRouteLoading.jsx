import { useTranslation } from 'react-i18next';

export default function CashierRouteLoading() {
  const { t } = useTranslation();
  return (
    <div className="d-flex flex-grow-1 align-items-center justify-content-center p-4 text-secondary">
      {t('common.loading')}
    </div>
  );
}
