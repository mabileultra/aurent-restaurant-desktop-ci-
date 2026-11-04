import { useEffect, useMemo, useRef } from 'react';
import { BaseButton, BaseModal } from '../../../components/ui';
import { usePharmacyReceiptMarkScan } from '../hooks/usePharmacyReceiptMarkScan';
import {
  marksForLine,
  receiptMarksProgress,
  requiredMarkCountForLine,
} from '../utils/pharmacyReceiptMarks';
import '../styles/pharmacy-receipt-mark-scan.css';

export default function PharmacyReceiptMarkScanModal({
  open,
  onClose,
  t,
  lines,
  marksByLineId,
  storeId,
  aslEnabled,
  acceptVerifiedMark,
  onRemove,
  disabled,
}) {
  const inputRef = useRef(null);
  const scan = usePharmacyReceiptMarkScan({
    lines,
    marksByLineId,
    storeId,
    aslEnabled,
    acceptVerifiedMark,
    t,
  });
  const marked = useMemo(
    () => (lines || []).filter((line) => line?.markedProduct),
    [lines],
  );
  const filtered = useMemo(() => {
    const q = scan.query.trim().toLowerCase();
    if (!q) return marked;
    return marked.filter((line) => String(line.productName || '').toLowerCase().includes(q));
  }, [marked, scan.query]);
  const progress = receiptMarksProgress(lines, marksByLineId);

  useEffect(() => {
    if (!open) return undefined;
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [open, scan.busy, progress.have]);

  return (
    <BaseModal
      open={open}
      onClose={disabled ? () => {} : onClose}
      title={t('pharmacyStock.marks.scanTitle')}
      size="lg"
      footer={(
        <BaseButton variant="secondary" onClick={onClose} disabled={scan.busy}>
          {t('common.close')}
        </BaseButton>
      )}
    >
      <div className="pharmacy-receipt-mark-scan">
        <p className="pharmacy-receipt-mark-scan__lead">
          {t('pharmacyStock.marks.scanLead', { have: progress.have, need: progress.need })}
        </p>
        <label className="pharmacy-receipt-mark-scan__field">
          <span>{t('pharmacyStock.marks.placeholder')}</span>
          <input
            ref={inputRef}
            type="search"
            autoComplete="off"
            autoFocus
            disabled={disabled || scan.busy}
            value={scan.draft}
            placeholder={t('pharmacyStock.marks.placeholder')}
            onChange={(e) => scan.setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                scan.submitDraft();
              }
            }}
          />
        </label>
        <label className="pharmacy-receipt-mark-scan__field">
          <span>{t('pharmacyStock.marks.scanSearch')}</span>
          <input
            type="search"
            value={scan.query}
            placeholder={t('pharmacyStock.toolbarSearch')}
            onChange={(e) => scan.setQuery(e.target.value)}
          />
        </label>
        {scan.lastHit?.status === 'ok' ? (
          <p className="pharmacy-receipt-mark-scan__ok">
            {t('pharmacyStock.marks.addedTo', { name: scan.lastHit.line?.productName || '' })}
          </p>
        ) : null}

        <ul className="pharmacy-receipt-mark-scan__lines">
          {filtered.map((line) => {
            const marks = marksForLine(marksByLineId, line.id);
            const need = requiredMarkCountForLine(line);
            const done = need > 0 && marks.length >= need;
            const pinned = scan.pinnedLineId === line.id;
            return (
              <li
                key={line.id}
                className={`pharmacy-receipt-mark-scan__line${done ? ' is-ready' : ''}${pinned ? ' is-pinned' : ''}`}
              >
                <button
                  type="button"
                  className="pharmacy-receipt-mark-scan__pick"
                  onClick={() => scan.setPinnedLineId(pinned ? null : line.id)}
                >
                  <strong>{line.productName}</strong>
                  <span>{t('pharmacyStock.marks.count', { have: marks.length, need })}</span>
                </button>
                {marks.length > 0 ? (
                  <ul className="pharmacy-receipt-mark-scan__codes">
                    {marks.map((mark) => (
                      <li key={mark.code}>
                        <code>{mark.code.slice(0, 28)}{mark.code.length > 28 ? '…' : ''}</code>
                        <button
                          type="button"
                          disabled={disabled || scan.busy}
                          onClick={() => onRemove?.(line.id, mark.code)}
                          aria-label={t('common.delete')}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="pharmacy-receipt-mark-scan__empty">{t('pharmacyStock.marks.scanLineEmpty')}</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </BaseModal>
  );
}
