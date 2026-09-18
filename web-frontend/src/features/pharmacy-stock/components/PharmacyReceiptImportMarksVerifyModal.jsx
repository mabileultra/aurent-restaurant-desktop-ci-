import { BaseButton, BaseModal } from '../../../components/ui';

/**
 * Спросить → полная ASL-проверка (без отмены) → точный итог принятых / отклонённых.
 */
export default function PharmacyReceiptImportMarksVerifyModal({
  open,
  onClose,
  t,
  markCount,
  etaSeconds = 0,
  aslEnabled,
  verifying,
  progress = { done: 0, total: 0 },
  resultSummary = null,
  onVerify,
  onSkip,
  onConfirmResult,
}) {
  const total = progress.total || markCount || 0;
  const done = progress.done || 0;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const locked = verifying || Boolean(resultSummary);

  const reasonLabel = (reason) => {
    if (reason === 'alreadySold') return t('pharmacyStock.marks.alreadySold');
    if (reason === 'notFound') return t('pharmacyStock.marks.notFound');
    return t('pharmacyStock.marks.verifyFailed');
  };

  return (
    <BaseModal
      open={open}
      onClose={locked ? () => {} : onClose}
      title={
        resultSummary
          ? t('pharmacyStock.marks.importResultTitle')
          : t('pharmacyStock.marks.importAskTitle')
      }
      size="sm"
      footer={(
        resultSummary ? (
          <BaseButton onClick={onConfirmResult}>
            {t('pharmacyStock.marks.importResultConfirm')}
          </BaseButton>
        ) : verifying ? null : (
          <>
            <BaseButton variant="secondary" onClick={onSkip}>
              {t('pharmacyStock.marks.importSkipVerify')}
            </BaseButton>
            <BaseButton onClick={onVerify} disabled={!aslEnabled}>
              {t('pharmacyStock.marks.importDoVerify')}
            </BaseButton>
          </>
        )
      )}
    >
      <div className="pharmacy-import-marks-ask">
        {resultSummary ? (
          <div className="pharmacy-import-marks-ask__result">
            <p className="pharmacy-import-marks-ask__text">
              {t('pharmacyStock.marks.importResultBody', {
                accepted: resultSummary.acceptedCount,
                rejected: resultSummary.rejectedCount,
              })}
            </p>
            <ul className="pharmacy-import-marks-ask__stats">
              <li>
                {t('pharmacyStock.marks.importResultAccepted', { count: resultSummary.acceptedCount })}
              </li>
              <li>
                {t('pharmacyStock.marks.importResultNotFound', { count: resultSummary.notFoundCount })}
              </li>
              <li>
                {t('pharmacyStock.marks.importResultSold', { count: resultSummary.alreadySoldCount })}
              </li>
              <li>
                {t('pharmacyStock.marks.importResultErrors', { count: resultSummary.errorCount })}
              </li>
            </ul>
            {resultSummary.rejectedCount > 0 ? (
              <div className="pharmacy-import-marks-ask__rejected">
                <div className="pharmacy-import-marks-ask__rejected-title">
                  {t('pharmacyStock.marks.importResultRejectedList')}
                </div>
                <ul className="pharmacy-import-marks-ask__rejected-list">
                  {resultSummary.rejected.map((item) => (
                    <li key={`${item.reason}:${item.code}`}>
                      <code>{item.code}</code>
                      <span>{reasonLabel(item.reason)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="pharmacy-import-marks-ask__hint">
              {t('pharmacyStock.marks.importResultHint')}
            </p>
          </div>
        ) : (
          <>
            <p className="pharmacy-import-marks-ask__text">
              {t('pharmacyStock.marks.importAskBody', { count: markCount })}
            </p>
            {!aslEnabled ? (
              <p className="pharmacy-import-marks-ask__warn">
                {t('pharmacyStock.marks.importAslDisabled')}
              </p>
            ) : (
              <p className="pharmacy-import-marks-ask__hint">
                {t('pharmacyStock.marks.importAskHint')}
                {markCount > 20 && etaSeconds > 0
                  ? ` ${t('pharmacyStock.marks.importAskEta', { seconds: etaSeconds })}`
                  : ''}
              </p>
            )}

            {verifying ? (
              <div className="pharmacy-import-marks-ask__progress" aria-live="polite">
                <div className="pharmacy-import-marks-ask__progress-label">
                  {t('pharmacyStock.marks.importProgress', { done, total })}
                </div>
                <div
                  className="pharmacy-import-marks-ask__bar"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="pharmacy-import-marks-ask__bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <p className="pharmacy-import-marks-ask__hint">
                  {t('pharmacyStock.marks.importProgressHint')}
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </BaseModal>
  );
}
