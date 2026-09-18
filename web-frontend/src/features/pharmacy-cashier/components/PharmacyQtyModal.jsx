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

function digits(value) {
  return String(value ?? '').replace(/[^\d]/g, '');
}

function lotKeyOf(lot) {
  return `${lot?.batchNumber || ''}|${lot?.expiryDate || ''}`;
}

/**
 * Модалка «Добавить товар в чек» — раскладка как в Осон, наш визуал.
 * КМ по-прежнему со скана в поиске кассы; чекбокс маркировки — статус товара.
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
  const [batchText, setBatchText] = useState('');
  const [packOnly, setPackOnly] = useState(false);
  const [markingOn, setMarkingOn] = useState(false);
  const [error, setError] = useState('');

  const unitsInPack = productUnitsInPack(product) || Number(product?.unitsInPack) || 1;
  const productAllowsPiece = productSellByPiece(product);
  const sellByPiece = productAllowsPiece && !packOnly;
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
  const showPackUi = unitsInPack > 1;
  const markedProduct = Boolean(product?.markedProduct);

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
    setPackOnly(!productAllowsPiece);
    setMarkingOn(markedProduct);
    const hintExpiry = productExpiry(product);
    const hintBatch = productBatch(product);
    setLotKey(hintExpiry || hintBatch ? `${hintBatch || ''}|${hintExpiry || ''}` : '');
    setBatchText(hintBatch || '');
    const timer = setTimeout(() => packRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [open, product, unitsInPack, productAllowsPiece, markedProduct]);

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

  useEffect(() => {
    if (!selectedLot) return;
    setBatchText(selectedLot.batchNumber || '');
  }, [selectedLot]);

  if (!open || !product) return null;

  const bumpPack = (delta) => {
    const next = Math.max(0, packs + delta);
    setPacksText(String(next));
    setError('');
  };

  const bumpPiece = (delta) => {
    if (!sellByPiece) return;
    const step = pieceStep > 1 ? pieceStep : 1;
    const next = Math.max(0, pieces + (delta > 0 ? step : -step));
    setPiecesText(String(next));
    setError('');
  };

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
      lot: selectedLot
        ? { ...selectedLot, batchNumber: batchText.trim() || selectedLot.batchNumber }
        : (batchText.trim() ? { batchNumber: batchText.trim(), expiryDate: expiryValue || null } : null),
      productMarks: [],
      markingOn,
    });
  };

  return (
    <div className="pharmacy-qty-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="pharmacy-qty-modal__backdrop"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div className="pharmacy-qty-modal__panel pharmacy-qty-modal__panel--sale">
        <header className="pharmacy-qty-modal__head">
          <h2 className="pharmacy-qty-modal__title">{t('pharmacyCashier.addToReceiptTitle')}</h2>
          <button type="button" className="pharmacy-qty-modal__x" onClick={onClose} aria-label={t('common.close')}>×</button>
        </header>

        <div className="pharmacy-qty-modal__name-bar" title={product.name}>
          {product.name}
        </div>

        <div className="pharmacy-qty-modal__body">
          <FieldRow label={t('pharmacyCashier.colManufacturer')}>
            <span className="pharmacy-qty-modal__box">{manufacturer || '—'}</span>
          </FieldRow>

          <FieldRow label={t('pharmacyCashier.colBarcode')}>
            <span className="pharmacy-qty-modal__box pharmacy-qty-modal__box--wrap">
              {uniqueBarcodes.join(', ') || '—'}
            </span>
          </FieldRow>

          <FieldRow label={t('pharmacyCashier.colIkpuMxik')}>
            <span className="pharmacy-qty-modal__box">{product.ikpu || '—'}</span>
          </FieldRow>

          <div className="pharmacy-qty-modal__row pharmacy-qty-modal__row--split">
            <FieldRow label={t('pharmacyCashier.colExpiryFull')} className="pharmacy-qty-modal__row--grow">
              {lots.length > 0 ? (
                <select
                  className="pharmacy-qty-modal__box pharmacy-qty-modal__box--input"
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
                <span className="pharmacy-qty-modal__box">{formatExpiryDisplay(expiryValue) || '—'}</span>
              )}
            </FieldRow>
            {showPackUi ? (
              <label className="pharmacy-qty-modal__inline-check">
                <input
                  type="checkbox"
                  checked={packOnly}
                  disabled={!productAllowsPiece}
                  onChange={(e) => {
                    setPackOnly(e.target.checked);
                    if (e.target.checked) setPiecesText('0');
                    setError('');
                  }}
                />
                <span>{t('pharmacyCashier.noSellByPiece')}</span>
              </label>
            ) : null}
          </div>

          <FieldRow label={t('pharmacyCashier.colBatch')}>
            <input
              className="pharmacy-qty-modal__box pharmacy-qty-modal__box--input"
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder="—"
            />
          </FieldRow>

          <div className="pharmacy-qty-modal__pair">
            <FieldRow label={t('pharmacyCashier.colPrice')}>
              <span className="pharmacy-qty-modal__box">{fmt(packPrice)}</span>
            </FieldRow>
            <FieldRow label={t('pharmacyCashier.vatShort')}>
              <span className="pharmacy-qty-modal__box">{fmt(Number(product.taxRate ?? 0))}</span>
            </FieldRow>
          </div>

          <div className="pharmacy-qty-modal__pair">
            <FieldRow label={showPackUi ? t('pharmacyCashier.pricePerPieceShort') : t('pharmacyCashier.pricePerPiece')}>
              <span className="pharmacy-qty-modal__box">{fmt(piecePrice)}</span>
            </FieldRow>
            <FieldRow label={t('pharmacyCashier.soldPacks')}>
              <span className="pharmacy-qty-modal__box">0 {t('pharmacyCashier.qtyPackShort')}</span>
            </FieldRow>
          </div>

          <div className="pharmacy-qty-modal__pair">
            <FieldRow label={t('pharmacyCashier.remaining')}>
              <span className="pharmacy-qty-modal__box">
                {roundQty(stockPacks)} {t('pharmacyCashier.qtyPackShort')}
              </span>
            </FieldRow>
            <FieldRow label={t('pharmacyCashier.inPack')}>
              <span className="pharmacy-qty-modal__box">{showPackUi ? unitsInPack : 1}</span>
            </FieldRow>
          </div>

          <div className="pharmacy-qty-modal__qty-block">
            <p className="pharmacy-qty-modal__qty-label">{t('pharmacyCashier.qtyLabel')}</p>
            <div className={`pharmacy-qty-modal__steppers${showPackUi ? '' : ' pharmacy-qty-modal__steppers--single'}`}>
              <Stepper
                inputRef={packRef}
                value={packsText}
                unit={t('pharmacyCashier.qtyPackShort')}
                active={packs > 0 || !showPackUi || !sellByPiece}
                onChange={(v) => {
                  setPacksText(digits(v));
                  setError('');
                }}
                onBump={bumpPack}
                onEnter={() => {
                  if (showPackUi && sellByPiece) return;
                  submit();
                }}
              />
              {showPackUi ? (
                <Stepper
                  value={sellByPiece ? piecesText : '0'}
                  unit={t('pharmacyCashier.qtyPieceShort')}
                  disabled={!sellByPiece}
                  active={sellByPiece && pieces > 0}
                  onChange={(v) => {
                    setPiecesText(digits(v));
                    setError('');
                  }}
                  onBump={bumpPiece}
                  onEnter={submit}
                />
              ) : null}
            </div>
            {!sellByPiece && showPackUi ? (
              <p className="pharmacy-qty-modal__hint pharmacy-qty-modal__hint--muted">
                {t('pharmacyCashier.noPieceSaleHint')}
              </p>
            ) : null}
            {sellByPiece && stepValues.length > 0 ? (
              <p className="pharmacy-qty-modal__hint">
                {t('pharmacyCashier.pieceStepHintOson', {
                  steps: stepValues.slice(0, 4).join(', '),
                })}
              </p>
            ) : null}
          </div>

          <div className="pharmacy-qty-modal__total-bar" aria-live="polite">
            {fmt(preview)} {t('pharmacyCashier.sumCurrency')}
          </div>

          {error ? <p className="pharmacy-qty-modal__error">{error}</p> : null}
        </div>

        <footer className="pharmacy-qty-modal__footer">
          <label className="pharmacy-qty-modal__marking">
            <input
              type="checkbox"
              checked={markingOn}
              disabled={!markedProduct}
              onChange={(e) => setMarkingOn(e.target.checked)}
            />
            <span>{t('pharmacyCashier.marking')}</span>
          </label>
          <div className="pharmacy-qty-modal__actions">
            <button type="button" className="pharmacy-qty-modal__btn pharmacy-qty-modal__btn--cancel" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="button" className="pharmacy-qty-modal__btn pharmacy-qty-modal__btn--ok" onClick={submit}>
              {t('pharmacyCashier.addProduct')}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FieldRow({ label, children, className = '' }) {
  return (
    <div className={`pharmacy-qty-modal__row ${className}`.trim()}>
      <span className="pharmacy-qty-modal__row-label">{label}</span>
      <div className="pharmacy-qty-modal__row-control">{children}</div>
    </div>
  );
}

function Stepper({
  inputRef,
  value,
  unit,
  disabled = false,
  active = false,
  onChange,
  onBump,
  onEnter,
}) {
  return (
    <div
      className={`pharmacy-qty-modal__stepper${active ? ' is-active' : ''}${disabled ? ' is-disabled' : ''}`}
    >
      <input
        ref={inputRef}
        inputMode="numeric"
        className="pharmacy-qty-modal__stepper-input"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onEnter?.();
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            onBump?.(1);
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            onBump?.(-1);
          }
        }}
      />
      <div className="pharmacy-qty-modal__stepper-side">
        <button type="button" tabIndex={-1} disabled={disabled} onClick={() => onBump?.(1)} aria-label="+">▴</button>
        <button type="button" tabIndex={-1} disabled={disabled} onClick={() => onBump?.(-1)} aria-label="-">▾</button>
      </div>
      <em className="pharmacy-qty-modal__stepper-unit">{unit}</em>
    </div>
  );
}
