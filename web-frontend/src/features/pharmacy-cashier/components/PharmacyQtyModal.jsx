import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { roundQty } from '../../../utils/quantityFormat';
import { round2 } from '../../../utils/taxAmounts';
import '../styles/pharmacy-qty-modal.css';
import '../styles/pharmacy-qty-modal-compact.css';

export default function PharmacyQtyModal({
  open,
  product,
  onConfirm,
  onClose,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [qtyText, setQtyText] = useState('1');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !product) return;
    setQtyText('1');
    setError('');
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);
    return () => clearTimeout(timer);
  }, [open, product]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const sellByPiece = product?.pharmacySellByPiece === true;
  const unitsInPack = Number(product?.unitsInPack) || 0;
  const unitPrice = Number(product?.sellingPrice ?? 0);
  const maxStock = Number(product?.stockQuantity ?? 0);
  const qty = useMemo(() => {
    const raw = Number(String(qtyText).replace(',', '.'));
    return Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;
  }, [qtyText]);
  const preview = round2(unitPrice * Math.max(0, qty));
  const canSubmit = qty > 0 && (maxStock <= 0 || qty <= maxStock);

  if (!open || !product) return null;

  const submit = () => {
    if (qty <= 0) {
      setError(t('pharmacyCashier.qtyInvalid'));
      return;
    }
    if (maxStock > 0 && qty > maxStock) {
      setError(t('pharmacyCashier.qtyExceedsStock'));
      return;
    }
    onConfirm?.(qty);
  };

  return (
    <div className="pharmacy-qty-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="pharmacy-qty-modal__backdrop"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div className="pharmacy-qty-modal__panel">
        <h2 className="pharmacy-qty-modal__title">{product.name}</h2>
        <div className="pharmacy-qty-modal__meta">
          <p>
            {sellByPiece ? t('pharmacyCashier.pricePerPiece') : t('pharmacyCashier.colPrice')}:{' '}
            <strong>{fmt(unitPrice)}</strong>
          </p>
          {sellByPiece && product.packUnitPrice ? (
            <p>
              {t('pharmacyCashier.packPrice')}: <strong>{fmt(product.packUnitPrice)}</strong>
              {' · '}
              {t('pharmacyCashier.packOf', { count: unitsInPack })}
            </p>
          ) : null}
          <p>
            {sellByPiece ? t('pharmacyCashier.stockPieces') : t('pharmacyCashier.colStock')}:{' '}
            <strong>
              {sellByPiece
                ? t('pharmacyCashier.pieceCount', { count: maxStock })
                : roundQty(maxStock)}
            </strong>
          </p>
        </div>

        <label className="pharmacy-qty-modal__label" htmlFor="pharmacy-qty-input">
          {sellByPiece ? t('pharmacyCashier.qtyPiecesLabel') : t('pharmacyCashier.qtyLabel')}
        </label>
        <input
          id="pharmacy-qty-input"
          ref={inputRef}
          className="pharmacy-qty-modal__input"
          inputMode="numeric"
          value={qtyText}
          onChange={(e) => {
            setQtyText(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
        />
        <p className="pharmacy-qty-modal__preview">
          {t('pharmacyCashier.linePreview', { sum: fmt(preview) })}
        </p>
        {error ? <p className="pharmacy-qty-modal__error">{error}</p> : null}

        <div className="pharmacy-qty-modal__actions">
          <button type="button" className="pharmacy-qty-modal__btn pharmacy-qty-modal__btn--cancel" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="pharmacy-qty-modal__btn pharmacy-qty-modal__btn--ok"
            disabled={!canSubmit}
            onClick={submit}
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
