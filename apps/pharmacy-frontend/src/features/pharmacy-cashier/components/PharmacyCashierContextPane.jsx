import { FlaskConical } from 'lucide-react';
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
        <FlaskConical size={36} strokeWidth={1.4} aria-hidden />
        <p>{t('pharmacyCashier.contextEmpty')}</p>
      </div>
    </section>
  );
}
