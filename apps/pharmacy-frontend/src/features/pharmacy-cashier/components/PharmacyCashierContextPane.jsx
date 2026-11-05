import { FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../styles/pharmacy-context-pane.css';

/**
 * Центральная рабочая область кассы (зона 2 ТЗ).
 * Пустое состояние или контекст строки / маркировки / подсказки.
 */
export default function PharmacyCashierContextPane({
  selectedLine = null,
  notice = null,
}) {
  const { t } = useTranslation();

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
            {selectedLine.markingCode ? (
              <>
                <dt>{t('pharmacyCashier.colMarking', { defaultValue: 'Маркировка' })}</dt>
                <dd className="pharmacy-cashier__context-mono">{selectedLine.markingCode}</dd>
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
