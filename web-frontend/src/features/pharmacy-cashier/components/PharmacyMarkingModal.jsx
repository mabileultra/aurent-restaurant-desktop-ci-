import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import PharmacyIntegrationIcon from './PharmacyIntegrationIcon';
import { PHARMACY_QUICK_LINK_IDS } from '../constants/pharmacyQuickLinks';
import '../styles/pharmacy-marking-modal.css';

export default function PharmacyMarkingModal({
  open,
  storeId,
  initialCode = '',
  initialResult = null,
  aslApiEnabled,
  aslPortalUrl,
  onClose,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const autoVerifiedRef = useRef('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);

  const { mutate: verifyMarking, isPending: verifying } = useMutation({
    mutationFn: (payload) => pharmacyIntegrationApi.verifyMarking(payload).then((r) => r.data),
    onSuccess: (data) => setResult(data),
    onError: (error) => {
      setResult({
        found: false,
        error: error.response?.data?.message ?? error.message,
      });
    },
  });

  useEffect(() => {
    if (!open) {
      autoVerifiedRef.current = '';
      return undefined;
    }
    setCode(initialCode || '');
    setResult(initialResult);
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);
    return () => clearTimeout(timer);
  }, [open, initialCode, initialResult]);

  useEffect(() => {
    if (!open || !aslApiEnabled || !storeId) return undefined;
    const trimmed = (initialCode || '').trim();
    if (!trimmed || initialResult || autoVerifiedRef.current === trimmed) return undefined;
    autoVerifiedRef.current = trimmed;
    verifyMarking({ storeId, code: trimmed });
    return undefined;
  }, [open, initialCode, initialResult, aslApiEnabled, storeId, verifyMarking]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (e) => {
    e?.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    if (!aslApiEnabled) {
      setResult({ found: false, error: t('pharmacyCashier.integrations.markingApiDisabled') });
      return;
    }
    verifyMarking({ storeId, code: trimmed });
  };

  return (
    <div className="pharmacy-marking-modal">
      <button type="button" className="pharmacy-marking-modal__backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div className="pharmacy-marking-modal__dialog" role="dialog" aria-labelledby="pharmacy-marking-title">
        <div className="pharmacy-marking-modal__head">
          <div className="pharmacy-marking-modal__title-row">
            <PharmacyIntegrationIcon linkId={PHARMACY_QUICK_LINK_IDS.MARKING} className="pharmacy-marking-modal__logo" />
            <h2 id="pharmacy-marking-title" className="pharmacy-marking-modal__title">
              {t('pharmacyCashier.integrations.markingTitle')}
            </h2>
          </div>
          <button type="button" className="pharmacy-marking-modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="pharmacy-marking-modal__body" onSubmit={submit}>
          <p className="pharmacy-marking-modal__hint">
            {aslApiEnabled
              ? t('pharmacyCashier.integrations.markingHintApi')
              : t('pharmacyCashier.integrations.markingHintPortal')}
          </p>

          <label className="pharmacy-marking-modal__label" htmlFor="pharmacy-marking-code">
            {t('pharmacyCashier.integrations.markingCodeLabel')}
          </label>
          <input
            id="pharmacy-marking-code"
            ref={inputRef}
            type="text"
            className="pharmacy-marking-modal__input"
            value={code}
            autoComplete="off"
            placeholder={t('pharmacyCashier.integrations.markingCodePh')}
            onChange={(e) => setCode(e.target.value)}
          />

          <div className="pharmacy-marking-modal__actions">
            {!aslApiEnabled && aslPortalUrl && (
              <a
                href={aslPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pharmacy-marking-modal__btn pharmacy-marking-modal__btn--ghost"
              >
                {t('pharmacyCashier.integrations.openAslPortal')}
              </a>
            )}
            <button
              type="submit"
              className="pharmacy-marking-modal__btn pharmacy-marking-modal__btn--primary"
              disabled={verifying || !code.trim()}
            >
              {verifying
                ? t('common.loading')
                : t('pharmacyCashier.integrations.markingVerify')}
            </button>
          </div>

          {result && (
            <div
              className={`pharmacy-marking-modal__result ${
                result.found ? 'pharmacy-marking-modal__result--ok' : 'pharmacy-marking-modal__result--err'
              }`}
            >
              {result.error && <p>{result.error}</p>}
              {result.found && (
                <dl className="pharmacy-marking-modal__facts">
                  {result.status && (
                    <>
                      <dt>{t('pharmacyCashier.integrations.markingStatus')}</dt>
                      <dd>{result.status}</dd>
                    </>
                  )}
                  {result.gtin && (
                    <>
                      <dt>GTIN</dt>
                      <dd>{result.gtin}</dd>
                    </>
                  )}
                  {result.productName && (
                    <>
                      <dt>{t('pharmacyCashier.integrations.markingProduct')}</dt>
                      <dd>{result.productName}</dd>
                    </>
                  )}
                  {result.expirationDate && (
                    <>
                      <dt>{t('pharmacyCashier.integrations.markingExpiry')}</dt>
                      <dd>{result.expirationDate}</dd>
                    </>
                  )}
                  {result.batch && (
                    <>
                      <dt>{t('pharmacyCashier.integrations.markingBatch')}</dt>
                      <dd>{result.batch}</dd>
                    </>
                  )}
                  {!result.status && !result.gtin && !result.productName && (
                    <dd>{t('pharmacyCashier.integrations.markingFound')}</dd>
                  )}
                </dl>
              )}
              {!result.found && !result.error && (
                <p>{t('pharmacyCashier.integrations.markingNotFound')}</p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
