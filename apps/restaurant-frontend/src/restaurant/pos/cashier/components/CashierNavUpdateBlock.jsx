import React from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';

/**
 * Блок статуса и прогресса обновления ПО в меню кассы ресторана.
 */
export default function CashierNavUpdateBlock({
  update,
  downloading,
  downloadPercent,
  updateTitle,
  updateBody,
  runUpdateAction,
  setOpen,
  t,
}) {
  if (!update) return null;

  return (
    <div className={`rst-cashier-nav-lookup__update${downloading ? ' is-downloading' : ''}`}>
      <strong>{updateTitle}</strong>
      <span>{updateBody}</span>
      {downloading ? (
        <>
          <div className="rst-cashier-nav-lookup__progress-meta">
            <span>
              {update.updateState === 'progress'
                ? t('rst.cashier.updateDownloadingBody', { percent: downloadPercent })
                : t('rst.cashier.updateDownloadStarting', { defaultValue: 'Загрузка начинается…' })}
            </span>
            {update.updateState === 'progress' ? <b>{downloadPercent}%</b> : null}
          </div>
          <div
            className="rst-cashier-nav-lookup__progress rst-cashier-nav-lookup__progress--lg"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={update.updateState === 'progress' ? downloadPercent : undefined}
          >
            <i style={{ width: `${update.updateState === 'progress' ? downloadPercent : 8}%` }} />
          </div>
        </>
      ) : null}
      {update.actionKey ? (
        <button
          type="button"
          className="rst-cashier-nav-lookup__update-action"
          onClick={() => {
            void runUpdateAction();
            if (update.updateState !== 'downloaded') setOpen(false);
          }}
        >
          {update.updateState === 'downloaded' ? (
            <RotateCcw size={16} strokeWidth={2.4} aria-hidden />
          ) : (
            <RefreshCw size={16} strokeWidth={2.4} aria-hidden />
          )}
          <span>{t(update.actionKey)}</span>
        </button>
      ) : null}
    </div>
  );
}
