import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { pharmacyWarehouseApi } from '../../../api';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { roundQty } from '../../../utils/quantityFormat';
import {
  normalizePackPieces,
  packPieceLineTotal,
  pieceStepHintValues,
  validatePackPieceQty,
} from '../utils/pharmacyPackQty';
import { pharmacyPieceUnitPrice } from '../utils/pharmacyPackSale';
import {
  formatExpiryDisplay,
  productAttr,
  productBatch,
  productExpiry,
  productPieceStep,
  productSellByPiece,
  productUnitsInPack,
} from '../utils/pharmacyProductMeta';
import '../styles/pharmacy-qty-modal.css';
import '../styles/pharmacy-qty-modal-compact.css';

function digits(value) {
  return String(value ?? '').replace(/[^\d]/g, '');
}

/**
 * Модалка количества. Маркировку сюда не выносим —
 * КМ и штрихкод читает одно поле поиска на кассе.
 */
export default function PharmacyQtyModal({
  open,
  product,
  storeId,
  onConfirm,
  onClose,
}) {
  const { t } = useTranslation();
  const packRef = useRef(null);
  const [packsText, setPacksText] = useState('0');
  const [piecesText, setPiecesText] = useState('0');
  const [lotKey, setLotKey] = useState('');
  const [error, setError] = useState('');

  const unitsInPack = productUnitsInPack(product) || Number(product?.unitsInPack) || 1;
  const sellByPiece = productSellByPiece(product);
  const pieceStep = productPieceStep(product);
  const packPrice = Number(product?.packUnitPrice ?? product?.sellingPrice ?? 0);
  const piecePrice = unitsInPack > 1
    ? pharmacyPieceUnitPrice(packPrice, unitsInPack)
    : packPrice;
  const stockPacks = Number(
    product?.pharmacySellByPiece && product?.packUnitPrice != null && unitsInPack > 1
      ? (Number(product.stockQuantity ?? 0) / unitsInPack)
      : (product?.stockQuantity ?? 0),
  );
  const manufacturer = productAttr(product, 'manufacturer', 'производитель', 'producer')
    || product?.manufacturer
    || '';
  const barcodes = [product?.barcode, ...(product?.barcodes || product?.additionalBarcodes || [])]
    .map((b) => String(b || '').trim())
    .filter(Boolean);
  const uniqueBarcodes = [...new Set(barcodes)];

  const lotsQuery = useQuery({
    queryKey: ['pharmacy-lots', storeId, product?.id],
    queryFn: () => pharmacyWarehouseApi.listLots({
      storeId,
      productId: product.id,
    }).then((r) => r.data),
    enabled: Boolean(open && storeId && product?.id),
  });
  const lots = lotsQuery.data ?? [];

  useEffect(() => {
    if (!open || !product) return;
    setPacksText(unitsInPack > 1 ? '0' : '1');
    setPiecesText('0');
    setError('');
    const hintExpiry = productExpiry(product);
    const hintBatch = productBatch(product);
    setLotKey(hintExpiry || hintBatch ? `${hintBatch || ''}|${hintExpiry || ''}` : '');
    const timer = setTimeout(() => packRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [open, product, unitsInPack]);

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

  const packs = Number(packsText) || 0;
  const pieces = sellByPiece ? (Number(piecesText) || 0) : 0;
  const normalized = useMemo(
    () => normalizePackPieces(packs, pieces, unitsInPack),
    [packs, pieces, unitsInPack],
  );
  const preview = packPieceLineTotal({
    packs: normalized.packs,
    pieces: sellByPiece ? normalized.pieces : 0,
    packPrice,
    piecePrice,
  });
  const stepValues = pieceStepHintValues(pieceStep, unitsInPack);
  const selectedLot = lots.find((lot) => lotKeyOf(lot) === lotKey) || null;
  const expiryValue = selectedLot?.expiryDate || productExpiry(product) || '';
  const batchValue = selectedLot?.batchNumber || productBatch(product) || '';

  if (!open || !product) return null;

  const submit = () => {
    const err = validatePackPieceQty({
      packs,
      pieces,
      unitsInPack,
      sellByPiece,
      pieceStep,
      stockPacks,
    }, t);
    if (err) {
      setError(err);
      return;
    }
    onConfirm?.({
      packs: normalized.packs,
      pieces: sellByPiece ? normalized.pieces : 0,
      lot: selectedLot,
      productMarks: [],
    });
  };

  const showPackUi = unitsInPack > 1;

  return (
    <div className="pharmacy-qty-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="pharmacy-qty-modal__backdrop"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div className="pharmacy-qty-modal__panel pharmacy-qty-modal__panel--sale">
        <div className="pharmacy-qty-modal__head">
          <h2 className="pharmacy-qty-modal__title">{t('pharmacyCashier.addToReceipt')}</h2>
          <button type="button" className="pharmacy-qty-modal__x" onClick={onClose} aria-label={t('common.close')}>×</button>
        </div>

        <p className="pharmacy-qty-modal__product">{product.name}</p>

        <dl className="pharmacy-qty-modal__grid">
          <Row label={t('pharmacyCashier.colManufacturer')} value={manufacturer || '—'} />
          <Row label={t('pharmacyCashier.colBarcode')} value={uniqueBarcodes.join(', ') || '—'} />
          <Row label={t('pharmacyCashier.colIkpu')} value={product.ikpu || '—'} />
          <div className="pharmacy-qty-modal__grid-row">
            <dt>{t('pharmacyCashier.colExpiry')}</dt>
            <dd>
              {lots.length > 0 ? (
                <select
                  className="pharmacy-qty-modal__select"
                  value={lotKey}
                  onChange={(e) => setLotKey(e.target.value)}
                >
                  <option value="">{t('pharmacyCashier.pickLot')}</option>
                  {lots.map((lot) => (
                    <option key={lot.id || lotKeyOf(lot)} value={lotKeyOf(lot)}>
                      {formatExpiryDisplay(lot.expiryDate) || '—'}
                      {lot.batchNumber ? ` · ${lot.batchNumber}` : ''}
                      {lot.quantity != null ? ` · ${roundQty(lot.quantity)}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                formatExpiryDisplay(expiryValue) || '—'
              )}
            </dd>
          </div>
          <Row label={t('pharmacyCashier.colBatch')} value={batchValue || '—'} />
          <div className="pharmacy-qty-modal__grid-row">
            <dt>{t('pharmacyCashier.colPrice')}</dt>
            <dd className="pharmacy-qty-modal__price-row">
              <strong>{fmt(packPrice)}</strong>
              <span>{t('pharmacyCashier.vatShort')} {fmt(Number(product.taxRate ?? 0))}</span>
            </dd>
          </div>
          {showPackUi ? (
            <Row label={t('pharmacyCashier.pricePerPiece')} value={fmt(piecePrice)} />
          ) : null}
          <div className="pharmacy-qty-modal__grid-row">
            <dt>{t('pharmacyCashier.stockLeft')}</dt>
            <dd>
              {roundQty(stockPacks)} {t('pharmacyCashier.packUnit')}
              {showPackUi ? (
                <span className="pharmacy-qty-modal__muted">
                  {' · '}{t('pharmacyCashier.packOf', { count: unitsInPack })}
                </span>
              ) : null}
            </dd>
          </div>
        </dl>

        <div className="pharmacy-qty-modal__metrics">
          <label className="pharmacy-qty-modal__metric">
            <span className="pharmacy-qty-modal__metric-label">{t('pharmacyCashier.qtyLabel')}</span>
            <span className="pharmacy-qty-modal__metric-row">
              <input
                ref={packRef}
                inputMode="numeric"
                className="pharmacy-qty-modal__qty-input"
                value={packsText}
                onChange={(e) => {
                  setPacksText(digits(e.target.value));
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (showPackUi && sellByPiece) return;
                    submit();
                  }
                }}
              />
              <em className="pharmacy-qty-modal__metric-unit">{t('pharmacyCashier.packUnit')}</em>
            </span>
          </label>

          {showPackUi ? (
            <label className={`pharmacy-qty-modal__metric${sellByPiece ? '' : ' is-disabled'}`}>
              <span className="pharmacy-qty-modal__metric-label">{t('pharmacyCashier.qtyPieces')}</span>
              <span className="pharmacy-qty-modal__metric-row">
                <input
                  inputMode="numeric"
                  className="pharmacy-qty-modal__qty-input"
                  value={sellByPiece ? piecesText : '0'}
                  disabled={!sellByPiece}
                  onChange={(e) => {
                    setPiecesText(digits(e.target.value));
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submit();
                    }
                  }}
                />
                <em className="pharmacy-qty-modal__metric-unit">{t('pharmacyCashier.pieceUnit')}</em>
              </span>
            </label>
          ) : null}

          <div className="pharmacy-qty-modal__metric" aria-live="polite">
            <span className="pharmacy-qty-modal__metric-label">{t('pharmacyCashier.colSum')}</span>
            <p className="pharmacy-qty-modal__metric-value">{fmt(preview)}</p>
          </div>
        </div>

        {!sellByPiece && showPackUi ? (
          <p className="pharmacy-qty-modal__hint">{t('pharmacyCashier.noPieceSaleHint')}</p>
        ) : null}
        {sellByPiece && stepValues.length > 0 ? (
          <p className="pharmacy-qty-modal__hint">
            {t('pharmacyCashier.pieceStepHint', { steps: stepValues.slice(0, 4).join(', ') })}
          </p>
        ) : null}

        {error ? <p className="pharmacy-qty-modal__error">{error}</p> : null}

        <div className="pharmacy-qty-modal__actions">
          <button type="button" className="pharmacy-qty-modal__btn pharmacy-qty-modal__btn--cancel" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="pharmacy-qty-modal__btn pharmacy-qty-modal__btn--ok"
            onClick={submit}
          >
            {t('pharmacyCashier.addLine')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="pharmacy-qty-modal__grid-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function lotKeyOf(lot) {
  return `${lot?.batchNumber || ''}|${lot?.expiryDate || ''}`;
}
