import { BaseButton } from '../../../components/ui';
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
    <div className="pharmacy-receipt-marks-bar">
      {progress.marked > 0 ? (
        <BaseButton variant="secondary" onClick={onScan}>
          {t('pharmacyStock.marks.scanButton')}
          <span className="pharmacy-receipt-marks-bar__count">
            {t('pharmacyStock.marks.count', { have: progress.have, need: progress.need })}
          </span>
        </BaseButton>
      ) : null}
      <span className="pharmacy-receipt-marks-bar__meta">
        {t('pharmacyStock.importTasnif.documentMeta', {
          marked: tasnif.marked,
          found: tasnif.found,
          pack: tasnif.pack,
        })}
      </span>
    </div>
  );
}
