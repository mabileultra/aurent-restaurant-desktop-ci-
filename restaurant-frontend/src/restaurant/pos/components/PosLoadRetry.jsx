import { BaseButton } from '../../../components/ui';

/** Inline offline/online load failure with retry — cashier / floor / kitchen. */
export default function PosLoadRetry({ t, messageKey, onRetry }) {
  return (
    <div className="rst-notice">
      <p className="mb-2">{t(messageKey)}</p>
      {typeof onRetry === 'function' ? (
        <BaseButton type="button" onClick={onRetry}>
          {t('common.retry', { defaultValue: 'Повторить' })}
        </BaseButton>
      ) : null}
    </div>
  );
}
