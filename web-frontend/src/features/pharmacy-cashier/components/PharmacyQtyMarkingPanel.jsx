import { useTranslation } from 'react-i18next';
import '../styles/pharmacy-qty-marking.css';

export default function PharmacyQtyMarkingPanel({
  scans,
  verifying,
  error,
  inputRef,
  onScan,
  onRemove,
}) {
  const { t } = useTranslation();

  return (
    <section className="pharmacy-qty-marking" aria-label={t('pharmacyCashier.marking')}>
      <p className="pharmacy-qty-marking__hint">{t('pharmacyCashier.markingScan.hint')}</p>
      <input
        ref={inputRef}
        type="text"
        className="pharmacy-qty-marking__input"
        autoComplete="off"
        placeholder={t('pharmacyCashier.integrations.markingCodePh')}
        aria-label={t('pharmacyCashier.integrations.markingCodeLabel')}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          const value = e.currentTarget.value.trim();
          if (!value) return;
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.value = '';
          onScan?.(value);
        }}
      />
      {verifying ? (
        <p className="pharmacy-qty-marking__status">{t('pharmacyCashier.markingScan.verifying')}</p>
      ) : null}
      {error ? <p className="pharmacy-qty-marking__error">{error}</p> : null}
      {scans.length === 0 ? (
        <p className="pharmacy-qty-marking__empty">{t('pharmacyCashier.markingScan.waiting')}</p>
      ) : (
        <ul className="pharmacy-qty-marking__list">
          {scans.map((scan, index) => (
            <li key={scan.key} className="pharmacy-qty-marking__item">
              <span className="pharmacy-qty-marking__badge">{t('pharmacyCashier.markingScan.scanned')}</span>
              <span className="pharmacy-qty-marking__code">{index + 1}. {scan.label}</span>
              {scan.aslStatus ? (
                <span className="pharmacy-qty-marking__asl">{scan.aslStatus}</span>
              ) : null}
              <button
                type="button"
                className="pharmacy-qty-marking__remove"
                onClick={() => onRemove?.(scan.key)}
              >
                {t('pharmacyCashier.markingScan.remove')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
