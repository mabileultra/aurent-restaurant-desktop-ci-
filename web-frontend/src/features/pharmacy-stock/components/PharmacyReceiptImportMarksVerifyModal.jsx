import { BaseButton, BaseModal } from '../../../components/ui';
import { resolveImportMarksAskMode } from '../utils/resolveImportMarksAskMode';

/**
 * После импорта: нет ASL → продолжить/отмена; есть ASL → проверить → итог.
 */
export default function PharmacyReceiptImportMarksVerifyModal({
  open,
  onClose,
  t,
  markCount,
  etaSeconds = 0,
  aslEnabled,
  aslReady = true,
  verifying,
  progress = { done: 0, total: 0 },
  resultSummary = null,
  onVerify,
  onSkip,
  onContinueWithoutVerify,
  onDiscard,
  onConfirmResult,
}) {
  const total = progress.total || markCount || 0;
  const done = progress.done || 0;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const mode = resolveImportMarksAskMode({
    askOpen: open,
    aslReady,
    aslEnabled,
    verifying,
    hasResult: Boolean(resultSummary),
  });
  const locked = mode === 'verifying' || mode === 'result';
  const continueWithout = onContinueWithoutVerify || onSkip;

  const reasonLabel = (reason) => {
    if (reason === 'alreadySold') return t('pharmacyStock.marks.alreadySold');
    if (reason === 'notFound') return t('pharmacyStock.marks.notFound');
    if (reason === 'noIntegration') return t('pharmacyStock.marks.noIntegration');
    return t('pharmacyStock.marks.verifyFailed');
  };

  const title =
    mode === 'result'
      ? t('pharmacyStock.marks.importResultTitle')
      : mode === 'no-asl'
        ? t('pharmacyStock.marks.importAslMissingTitle')
        : t('pharmacyStock.marks.importAskTitle');

  const footer =
    mode === 'result' ? (
      <BaseButton onClick={onConfirmResult}>
        {t('pharmacyStock.marks.importResultConfirm')}
      </BaseButton>
    ) : mode === 'verifying' ? null : mode === 'no-asl' ? (
      <>
        <BaseButton variant="secondary" onClick={onDiscard}>
          {t('pharmacyStock.marks.importAslDiscard')}
        </BaseButton>
        <BaseButton onClick={continueWithout}>
          {t('pharmacyStock.marks.importAslContinue')}
        </BaseButton>
      </>
    ) : mode === 'ask' ? (
      <>
        <BaseButton variant="secondary" onClick={onSkip}>
          {t('pharmacyStock.marks.importSkipVerify')}
        </BaseButton>
        <BaseButton onClick={onVerify}>
          {t('pharmacyStock.marks.importDoVerify')}
        </BaseButton>
      </>
    ) : null;

  return (
    <BaseModal
      open={open && mode !== 'idle'}
      onClose={locked ? () => {} : onClose}
      title={title}
      size="sm"
      footer={footer}
    >
      <div className="pharmacy-import-marks-ask">
        {mode === 'result' ? (
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
              {(resultSummary.noIntegrationCount || 0) > 0 ? (
                <li>
                  {t('pharmacyStock.marks.importResultNoIntegration', {
                    count: resultSummary.noIntegrationCount,
                  })}
                </li>
              ) : null}
              <li>
                {t('pharmacyStock.marks.importResultErrors', { count: resultSummary.errorCount })}
              </li>
            </ul>
            {(resultSummary.noIntegrationCount || 0) > 0 ? (
              <p className="pharmacy-import-marks-ask__warn">
                {t('pharmacyStock.marks.noIntegration')}
              </p>
            ) : null}
            {resultSummary.rejectedCount > 0 && !(resultSummary.noIntegrationCount > 0
              && resultSummary.noIntegrationCount === resultSummary.rejectedCount) ? (
              <div className="pharmacy-import-marks-ask__rejected">
                <div className="pharmacy-import-marks-ask__rejected-title">
                  {t('pharmacyStock.marks.importResultRejectedList')}
                </div>
                <ul className="pharmacy-import-marks-ask__rejected-list">
                  {resultSummary.rejected
                    .filter((item) => item.reason !== 'noIntegration')
                    .map((item) => (
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
        ) : mode === 'no-asl' ? (
          <>
            <p className="pharmacy-import-marks-ask__text">
              {t('pharmacyStock.marks.importAslMissingBody', { count: markCount })}
            </p>
            <p className="pharmacy-import-marks-ask__warn">
              {t('pharmacyStock.marks.importAslMissingWarn')}
            </p>
            <p className="pharmacy-import-marks-ask__hint">
              {t('pharmacyStock.marks.importAslMissingHint')}
            </p>
          </>
        ) : (
          <>
            <p className="pharmacy-import-marks-ask__text">
              {t('pharmacyStock.marks.importAskBody', { count: markCount })}
            </p>
            <p className="pharmacy-import-marks-ask__hint">
              {t('pharmacyStock.marks.importAskHint')}
              {markCount > 20 && etaSeconds > 0
                ? ` ${t('pharmacyStock.marks.importAskEta', { seconds: etaSeconds })}`
                : ''}
            </p>

            {mode === 'verifying' ? (
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
