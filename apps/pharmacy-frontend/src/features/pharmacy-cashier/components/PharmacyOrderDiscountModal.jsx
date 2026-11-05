import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Percent, Plus, X } from 'lucide-react';
import PosModalPortal from '../../../components/shared/PosModalPortal';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { round2 } from '../../../utils/taxAmounts';
import '../styles/pharmacy-modal-shell.css';
import '../styles/pharmacy-discount-modal.css';

const PRESET_PERCENTS = [5, 10, 15, 20];

/**
 * Скидка на чек — аптечный скин (ТЗ молочный / зелёный).
 */
export default function PharmacyOrderDiscountModal({
  open,
  onClose,
  linesTotal,
  orderDiscount,
  onApplyAmount,
  onApplyPercent,
  onClear,
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('percent');
  const [draft, setDraft] = useState('0');

  const parsed = useMemo(() => {
    const v = String(draft).replace(',', '.').trim();
    if (v === '' || v === '.') return 0;
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  }, [draft]);

  const previewAmount =
    mode === 'percent'
      ? round2(Math.min(linesTotal, linesTotal * (Math.max(0, Math.min(100, parsed)) / 100)))
      : round2(Math.min(linesTotal, Math.max(0, parsed)));

  const previewTotal = round2(Math.max(0, linesTotal - previewAmount));
  const previewPercent = linesTotal > 0 ? Math.round((previewAmount / linesTotal) * 100) : 0;

  useEffect(() => {
    if (!open) return;
    if (orderDiscount > 0 && linesTotal > 0) {
      const pct = round2((orderDiscount / linesTotal) * 100);
      const isRoundPct = PRESET_PERCENTS.some((p) => Math.abs(pct - p) < 0.05) || pct === Math.round(pct);
      if (isRoundPct) {
        setMode('percent');
        setDraft(String(Math.round(pct)));
      } else {
        setMode('amount');
        setDraft(String(orderDiscount));
      }
      return;
    }
    setMode('percent');
    setDraft('0');
  }, [open, orderDiscount, linesTotal]);

  const handleApply = () => {
    if (previewAmount <= 0) onClear();
    else if (mode === 'percent') onApplyPercent(parsed);
    else onApplyAmount(parsed);
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <PosModalPortal open={open} onClose={onClose}>
      <div
        className="pharmacy-modal pharmacy-modal__panel pharmacy-discount-modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pharmacy-order-discount-title"
      >
        <header className="pharmacy-modal__head">
          <h2 id="pharmacy-order-discount-title" className="pharmacy-modal__title">
            {t('pos.orderDiscountTitle')}
          </h2>
          <button type="button" className="pharmacy-modal__close" onClick={onClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </header>

        <div className="pharmacy-modal__body">
          <p className="pharmacy-discount-modal__base">
            <span>{t('pos.orderDiscountBase')}</span>
            <strong>{fmt(linesTotal)}</strong>
          </p>

          <div className="pharmacy-discount-modal__mode" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'percent'}
              className={mode === 'percent' ? 'is-active' : ''}
              onClick={() => {
                setMode('percent');
                if (linesTotal > 0 && orderDiscount > 0) {
                  setDraft(String(Math.round((orderDiscount / linesTotal) * 100)));
                }
              }}
            >
              <Percent size={16} aria-hidden />
              {t('pos.orderDiscountPercent')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'amount'}
              className={mode === 'amount' ? 'is-active' : ''}
              onClick={() => {
                setMode('amount');
                setDraft(String(orderDiscount > 0 ? orderDiscount : 0));
              }}
            >
              {t('pos.orderDiscountAmount')}
            </button>
          </div>

          <div className="pharmacy-discount-modal__editor">
            <button
              type="button"
              className="pharmacy-discount-modal__step"
              onClick={() => setDraft(String(Math.max(0, parsed - (mode === 'percent' ? 1 : 100))))}
            >
              <Minus size={18} />
            </button>
            <div className="pharmacy-discount-modal__input-wrap">
              <input
                type="text"
                inputMode="decimal"
                className="pharmacy-discount-modal__input"
                value={draft}
                onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, ''))}
              />
              <span className="pharmacy-discount-modal__suffix">{mode === 'percent' ? '%' : ''}</span>
            </div>
            <button
              type="button"
              className="pharmacy-discount-modal__step"
              onClick={() =>
                setDraft(
                  String(
                    mode === 'percent'
                      ? Math.min(100, parsed + 1)
                      : round2(Math.min(linesTotal, parsed + 100)),
                  ),
                )
              }
            >
              <Plus size={18} />
            </button>
          </div>

          {mode === 'percent' ? (
            <div className="pharmacy-discount-modal__presets">
              {PRESET_PERCENTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`pharmacy-discount-modal__preset${parsed === p ? ' is-active' : ''}`}
                  onClick={() => setDraft(String(p))}
                >
                  {p}%
                </button>
              ))}
            </div>
          ) : null}

          <div className="pharmacy-discount-modal__preview">
            <p>
              {t('pos.discount')}
              {previewPercent > 0 ? ` (${previewPercent}%)` : ''}: <strong>−{fmt(previewAmount)}</strong>
            </p>
            <p className="pharmacy-discount-modal__preview-total">
              {t('pos.totalPayable')}: <strong>{fmt(previewTotal)}</strong>
            </p>
          </div>
        </div>

        <footer className="pharmacy-modal__footer">
          <button type="button" className="pharmacy-modal__btn pharmacy-modal__btn--ghost" onClick={handleClear}>
            {t('pos.orderDiscountClear')}
          </button>
          <button type="button" className="pharmacy-modal__btn pharmacy-modal__btn--primary" onClick={handleApply}>
            {t('pos.orderDiscountApply')}
          </button>
        </footer>
      </div>
    </PosModalPortal>
  );
}
