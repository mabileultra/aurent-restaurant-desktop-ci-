import { useTranslation } from 'react-i18next';
import PharmacyPreviewReceipt from './PharmacyPreviewReceipt';
import '../styles/pharmacy-context-pane.css';
import '../styles/pharmacy-preview-receipt.css';

/**
 * Центральная рабочая область кассы (зона 2 ТЗ).
 */
export default function PharmacyCashierContextPane({
  selectedLine = null,
  notice = null,
  preview = null,
  onPrintPreview = null,
}) {
  const { t } = useTranslation();

  if (preview?.items?.length) {
    return (
      <section
        className="pharmacy-cashier__context-pane"
        aria-label={t('pharmacyCashier.contextTitle')}
      >
        <PharmacyPreviewReceipt
          receiptNo={preview.receiptNo}
          items={preview.items}
          total={preview.total}
          onPrint={onPrintPreview}
        />
      </section>
    );
  }

  if (notice) {
    return (
      <section
        className="pharmacy-cashier__context-pane"
        aria-label={t('pharmacyCashier.contextTitle')}
      >
        <div className="pharmacy-cashier__context-card">
          <p className="pharmacy-cashier__context-notice">{notice}</p>
        </div>
      </section>
    );
  }

  if (selectedLine) {
    return (
      <section
        className="pharmacy-cashier__context-pane"
        aria-label={t('pharmacyCashier.contextTitle')}
      >
        <div className="pharmacy-cashier__context-card">
          <h3 className="pharmacy-cashier__context-name">{selectedLine.name}</h3>
          <dl className="pharmacy-cashier__context-meta">
            {selectedLine.sku ? (
              <>
                <dt>{t('pharmacyCashier.colSku', { defaultValue: 'SKU' })}</dt>
                <dd>{selectedLine.sku}</dd>
              </>
            ) : null}
            {(selectedLine.markCode || selectedLine.productMark) ? (
              <>
                <dt>{t('pharmacyCashier.colMarking', { defaultValue: 'Маркировка' })}</dt>
                <dd className="pharmacy-cashier__context-mono">
                  {selectedLine.markCode || selectedLine.productMark}
                </dd>
              </>
            ) : null}
          </dl>
        </div>
      </section>
    );
  }

  return (
    <section
      className="pharmacy-cashier__context-pane pharmacy-cashier__context-pane--empty"
      aria-label={t('pharmacyCashier.contextTitle')}
    >
      <div className="pharmacy-cashier__context-empty">
        <svg className="pharmacy-cashier__mortar" viewBox="0 0 64 64" width="72" height="72" aria-hidden>
          <path fill="none" stroke="#c5d0cb" strokeWidth="2.2" strokeLinecap="round" d="M18 28c0-8 6-14 14-14s14 6 14 14c0 10-6 16-14 18-8-2-14-8-14-18z" />
          <path fill="none" stroke="#c5d0cb" strokeWidth="2.2" strokeLinecap="round" d="M22 40h20M26 46h12" />
          <path fill="none" stroke="#b7c4be" strokeWidth="2.2" strokeLinecap="round" d="M40 18l10-8M44 22l8-4" />
          <circle cx="34" cy="26" r="5" fill="none" stroke="#9fb0a8" strokeWidth="2" />
          <path fill="none" stroke="#9fb0a8" strokeWidth="2" d="M34 23v6M31 26h6" />
        </svg>
        <p>{t('pharmacyCashier.contextEmpty')}</p>
        <span>{t('pharmacyCashier.contextEmptyHint')}</span>
      </div>
    </section>
  );
}
