import { summarizePharmacyImportTasnif } from '../utils/summarizePharmacyImportTasnif';
import { receiptMarksProgress } from '../utils/pharmacyReceiptMarks';
import '../styles/pharmacy-receipt-marks-bar.css';

export default function PharmacyReceiptMarksBar({
  t,
  lines,
  marksByLineId,
  onScan,
}) {
  const tasnif = summarizePharmacyImportTasnif(lines);
  const progress = receiptMarksProgress(lines, marksByLineId);
  if (!progress.marked && !tasnif.found && !tasnif.manual) return null;

  return (
    <section className="pharmacy-receipt-marks-bar">
      <div className="pharmacy-receipt-marks-bar__copy">
        <span className="pharmacy-receipt-marks-bar__badge">{t('pharmacyStock.importTasnif.badge')}</span>
        <div>
          <p className="pharmacy-receipt-marks-bar__title">{t('pharmacyStock.importTasnif.documentTitle')}</p>
          <p className="pharmacy-receipt-marks-bar__meta">
            {t('pharmacyStock.importTasnif.documentMeta', {
              marked: tasnif.marked,
              found: tasnif.found,
              pack: tasnif.pack,
            })}
          </p>
        </div>
      </div>
      {progress.marked > 0 ? (
        <button type="button" className="pharmacy-receipt-marks-bar__scan" onClick={onScan}>
          {t('pharmacyStock.marks.scanButton')}
          <span className="pharmacy-receipt-marks-bar__count">
            {t('pharmacyStock.marks.count', { have: progress.have, need: progress.need })}
          </span>
        </button>
      ) : null}
    </section>
  );
}
