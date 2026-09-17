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
import { usePharmacyQtyMarkingScan } from '../hooks/usePharmacyQtyMarkingScan';
import PharmacyQtyMarkingPanel from './PharmacyQtyMarkingPanel';
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

export default function PharmacyQtyModal({
  open,
  product,
  storeId,
  aslMarkingEnabled = false,
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
  const marked = product?.markedProduct === true;
  const marking = usePharmacyQtyMarkingScan({
    open,
    product,
    storeId,
    aslMarkingEnabled,
    stockPacks,
  });

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
    setPacksText(marked ? '0' : (unitsInPack > 1 ? '0' : '1'));
    setPiecesText('0');
    setError('');
    const hintExpiry = productExpiry(product);
    const hintBatch = productBatch(product);
    setLotKey(hintExpiry || hintBatch ? `${hintBatch || ''}|${hintExpiry || ''}` : '');
    if (marked) return undefined;
    const timer = setTimeout(() => packRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [open, product, unitsInPack, marked]);

  useEffect(() => {
    if (!open || !marked) return;
    setPacksText(String(marking.scans.length));
    setPiecesText('0');
  }, [open, marked, marking.scans.length]);

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

  const packs = marked ? marking.scans.length : (Number(packsText) || 0);
  const pieces = marked || !sellByPiece ? 0 : (Number(piecesText) || 0);
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
    if (marked && marking.scans.length === 0) {
      setError(t('pharmacyCashier.markingScan.needScan'));
      return;
    }
    const submitPacks = marked ? marking.scans.length : packs;
    const submitPieces = marked ? 0 : pieces;
    const err = validatePackPieceQty({
      packs: submitPacks,
      pieces: submitPieces,
      unitsInPack,
      sellByPiece: marked ? false : sellByPiece,
      pieceStep,
      stockPacks,
    }, t);
    if (err) {
      setError(err);
      return;
    }
    onConfirm?.({
      packs: marked ? marking.scans.length : normalized.packs,
      pieces: marked || !sellByPiece ? 0 : normalized.pieces,
      lot: selectedLot,
      productMarks: marked ? marking.scans.map((scan) => scan.mark) : [],
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

        {marked ? (
          <PharmacyQtyMarkingPanel
            scans={marking.scans}
            verifying={marking.verifying}
            error={marking.error}
            inputRef={marking.inputRef}
            onScan={marking.enqueue}
            onRemove={marking.removeScan}
          />
        ) : null}

        <div className={`pharmacy-qty-modal__qty${showPackUi ? '' : ' pharmacy-qty-modal__qty--single'}`}>
          <label className="pharmacy-qty-modal__qty-box">
            <span>{t('pharmacyCashier.qtyPacks')}</span>
            <input
              ref={packRef}
              inputMode="numeric"
              readOnly={marked}
              tabIndex={marked ? -1 : 0}
              className="pharmacy-qty-modal__qty-input"
              value={marked ? String(marking.scans.length) : packsText}
              onFocus={() => {
                if (marked) marking.inputRef.current?.focus();
              }}
              onChange={(e) => {
                if (marked) return;
                setPacksText(digits(e.target.value));
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <em>{t('pharmacyCashier.packUnit')}</em>
          </label>
          {showPackUi ? (
            <label className={`pharmacy-qty-modal__qty-box${sellByPiece ? '' : ' is-disabled'}`}>
              <span>{t('pharmacyCashier.qtyPieces')}</span>
              <input
                inputMode="numeric"
                className="pharmacy-qty-modal__qty-input"
                value={sellByPiece && !marked ? piecesText : '0'}
                disabled={!sellByPiece || marked}
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
              <em>{t('pharmacyCashier.pieceUnit')}</em>
            </label>
          ) : null}
        </div>

        {!sellByPiece && showPackUi ? (
          <p className="pharmacy-qty-modal__hint">{t('pharmacyCashier.noPieceSaleHint')}</p>
        ) : null}
        {sellByPiece && stepValues.length > 0 ? (
          <p className="pharmacy-qty-modal__hint">
            {t('pharmacyCashier.pieceStepHint', { steps: stepValues.slice(0, 4).join(', ') })}
          </p>
        ) : null}

        <p className="pharmacy-qty-modal__total">{fmt(preview)}</p>
        {error ? <p className="pharmacy-qty-modal__error">{error}</p> : null}

        <div className="pharmacy-qty-modal__actions">
          <button type="button" className="pharmacy-qty-modal__btn pharmacy-qty-modal__btn--cancel" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="pharmacy-qty-modal__btn pharmacy-qty-modal__btn--ok"
            onClick={submit}
            disabled={marked && marking.verifying}
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
