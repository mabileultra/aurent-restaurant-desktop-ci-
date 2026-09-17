import { useTranslation } from 'react-i18next';
import '../styles/pharmacy-qty-marking.css';

export default function PharmacyQtyMarkingPanel({
  scans,
  verifying,
  error,
  qty,
  sumLabel,
  inputRef,
  onScan,
  onRemove,
}) {
  const { t } = useTranslation();

  return (
    <section className="pharmacy-qty-marking" aria-label={t('pharmacyCashier.marking')}>
      <div className="pharmacy-qty-marking__metrics">
        <div className="pharmacy-qty-marking__metric">
          <span>{t('pharmacyCashier.qtyLabel')}</span>
          <strong>{qty}</strong>
        </div>
        <div className="pharmacy-qty-marking__metric">
          <span>{t('pharmacyCashier.colSum')}</span>
          <strong>{sumLabel}</strong>
        </div>
      </div>

      <div className={`pharmacy-qty-marking__scan${scans.length ? ' has-scans' : ''}`}>
        <div className="pharmacy-qty-marking__scan-art" aria-hidden>
          <svg viewBox="0 0 64 64" width="56" height="56">
            <rect x="6" y="6" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
            <rect x="40" y="6" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
            <rect x="6" y="40" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M40 44h8v8M52 40v12M40 52h4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M28 12h8M12 28h8M28 44h4M44 28h8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        <p className="pharmacy-qty-marking__scan-title">{t('pharmacyCashier.markingScan.scanTitle')}</p>
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
      </div>

      {scans.length === 0 ? (
        <p className="pharmacy-qty-marking__empty">{t('pharmacyCashier.markingScan.waiting')}</p>
      ) : (
        <ul className="pharmacy-qty-marking__list">
          {scans.map((scan, index) => (
            <li key={scan.key} className="pharmacy-qty-marking__item">
              <span className="pharmacy-qty-marking__index">{index + 1}</span>
              <span className="pharmacy-qty-marking__code">{scan.label}</span>
              <span className="pharmacy-qty-marking__badge">{t('pharmacyCashier.markingScan.scanned')}</span>
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
