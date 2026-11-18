import React from 'react';

/**
 * Плавающий баннер загрузки обновления при закрытом меню.
 */
export default function CashierNavDownloadFloat({
  open,
  downloading,
  downloadPercent,
  updateState,
  t,
}) {
  if (open || !downloading) return null;

  return (
    <div className="rst-cashier-nav-lookup__float" role="status" aria-live="polite">
      <strong>{t('rst.cashier.updateDownloadingTitle')}</strong>
      <span>
        {updateState === 'progress'
          ? t('rst.cashier.updateDownloadingBody', { percent: downloadPercent })
          : t('rst.cashier.updateDownloadStarting', { defaultValue: 'Загрузка начинается…' })}
      </span>
      <div
        className="rst-cashier-nav-lookup__progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={updateState === 'progress' ? downloadPercent : undefined}
      >
        <i style={{ width: `${updateState === 'progress' ? downloadPercent : 8}%` }} />
      </div>
    </div>
  );
}
