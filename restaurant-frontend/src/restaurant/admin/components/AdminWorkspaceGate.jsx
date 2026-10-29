import { BaseButton } from '../../../components/ui';

/**
 * Shared offline-safe entry for admin pages that need a store + optional query.
 */
export default function AdminWorkspaceGate({
  t,
  workspace,
  isLoading = false,
  isError = false,
  onRetry,
  children,
}) {
  if (workspace?.noAssignment) {
    return <div className="rst-notice">{t('rst.floor.noStore')}</div>;
  }
  if (!workspace?.storeId) {
    if (workspace?.isLoading) {
      return <div className="rst-empty">{t('common.loading')}</div>;
    }
    return <div className="rst-notice">{t('rst.admin.selectStore')}</div>;
  }
  if (isLoading) {
    return <div className="rst-empty">{t('common.loading')}</div>;
  }
  if (isError) {
    return (
      <div className="rst-notice">
        <p className="mb-2">{t('rst.admin.pageLoadFailed', { defaultValue: 'Не удалось загрузить раздел' })}</p>
        {onRetry ? (
          <BaseButton type="button" onClick={onRetry}>
            {t('common.retry', { defaultValue: 'Повторить' })}
          </BaseButton>
        ) : null}
      </div>
    );
  }
  return children;
}
