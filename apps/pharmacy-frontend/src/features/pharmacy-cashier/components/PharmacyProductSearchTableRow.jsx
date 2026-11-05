import { Pencil, Trash2 } from 'lucide-react';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { formatQty } from '../../../utils/quantityFormat';
import { resolveProductUnitPrice } from '../../../utils/productPrice';
import {
  daysUntilExpiry,
  formatExpiryDisplay,
  productBatch,
  productCountry,
  productDosageForm,
  productExpiry,
  productManufacturer,
  productRequiresPrescription,
  productSellByUnitHint,
  productShelfLifeDays,
  productStorageLocation,
} from '../utils/pharmacyProductMeta';
import { productReferencePrice, productScore } from '../utils/pharmacyProductScoreRef';
import { productIkpu, productPackageCode } from '../utils/pharmacyProductFiscalMeta';
import {
  pharmacyCellToneClass,
  pharmacyExpiryTone,
  pharmacyStockTone,
} from '../utils/pharmacyCellTone';

function formatStockExpiryDays(daysLeft, shelfLife, daysLabel) {
  if (daysLeft == null) return '—';
  if (shelfLife != null) return `${daysLeft}/${shelfLife} ${daysLabel}`;
  return `${daysLeft} ${daysLabel}`;
}

export default function PharmacyProductSearchTableRow({
  product,
  storeId,
  productsStale,
  t,
  daysLabel,
  col,
  onSelectProduct,
  onEditProduct,
  onDeactivateProduct,
}) {
  const outOfStock =
    (product.saleType || 'PIECE') !== 'SERVICE'
    && Number(product.stockQuantity) <= 0;
  const inactive = product.active === false;
  const disabled = outOfStock || inactive || productsStale;
  const country = productCountry(product) || '—';
  const batch = productBatch(product) || '—';
  const manufacturer = productManufacturer(product) || '—';
  const shelf = productStorageLocation(product) || '—';
  const expiryDate = formatExpiryDisplay(productExpiry(product));
  const sellByUnit = productSellByUnitHint(product);
  const stockTone = disabled ? null : pharmacyStockTone(product);
  const expiryTone = disabled ? null : pharmacyExpiryTone(product);
  const needsRx = productRequiresPrescription(product);
  const daysLeft = daysUntilExpiry(productExpiry(product));
  const shelfLife = productShelfLifeDays(product);
  const daysLabelText = formatStockExpiryDays(daysLeft, shelfLife, daysLabel);
  const mxik = productIkpu(product) || '—';
  const ikpu = productPackageCode(product) || productIkpu(product) || '—';
  const fiscal = ikpu !== mxik ? `${ikpu} / ${mxik}` : mxik;
  const unitPrice = resolveProductUnitPrice(product, storeId);
  const cost = Number(product.costPrice ?? 0);
  const score = productScore(product);
  const refPrice = productReferencePrice(product);
  const form = productDosageForm(product);
  const meta = [
    form || '',
    expiryDate ? `${t('pharmacyCashier.colExpiryShort')}: ${expiryDate}` : '',
    sellByUnit ? t('pharmacyCashier.sellByUnitHintShort') : '',
  ].filter(Boolean).join(' · ');

  return (
    <tr
      className={[
        'pharmacy-search__row',
        disabled ? 'is-disabled' : '',
        needsRx ? 'is-recipe' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => {
        if (!disabled) onSelectProduct(product);
      }}
    >
      <td className="pharmacy-search__name" title={product.name}>
        <div className="pharmacy-search__name-block">
          <span className="pharmacy-search__cell-text pharmacy-search__cell-text--name">
            {product.name}
          </span>
          {needsRx ? (
            <span className="pharmacy-search__recipe-tag">{t('pharmacyCashier.recipeTag')}</span>
          ) : null}
          {meta ? <span className="pharmacy-search__name-meta">{meta}</span> : null}
        </div>
      </td>
      {col('stock') ? (
        <td className={['pharmacy-search__num', pharmacyCellToneClass(stockTone, 'pharmacy-search__cell')].filter(Boolean).join(' ')}>
          <span className="pharmacy-search__badge">
            {formatQty(product.stockQuantity ?? 0, product.saleType, product.unitCode)}
          </span>
        </td>
      ) : null}
      {col('cost') ? <td className="pharmacy-search__num">{cost > 0 ? fmt(cost) : '—'}</td> : null}
      {col('price') ? <td className="pharmacy-search__num">{fmt(unitPrice)}</td> : null}
      {col('unitPrice') ? <td className="pharmacy-search__num">{fmt(unitPrice)}</td> : null}
      {col('expiry') ? (
        <td className={['pharmacy-search__mono', pharmacyCellToneClass(expiryTone, 'pharmacy-search__cell')].filter(Boolean).join(' ')} title={expiryDate || undefined}>
          <span className="pharmacy-search__badge">{daysLabelText}</span>
        </td>
      ) : null}
      {col('shelf') ? (
        <td className="pharmacy-search__mono pharmacy-search__clip" title={shelf}>
          <span className="pharmacy-search__cell-text">{shelf}</span>
        </td>
      ) : null}
      {col('manufacturer') ? (
        <td className="pharmacy-search__mono pharmacy-search__clip" title={manufacturer}>
          <span className="pharmacy-search__cell-text">{manufacturer}</span>
        </td>
      ) : null}
      {col('country') ? (
        <td className="pharmacy-search__mono pharmacy-search__clip" title={country}>
          <span className="pharmacy-search__cell-text">{country}</span>
        </td>
      ) : null}
      {col('batch') ? (
        <td className="pharmacy-search__mono pharmacy-search__clip" title={batch}>
          <span className="pharmacy-search__cell-text">{batch}</span>
        </td>
      ) : null}
      {col('score') ? <td className="pharmacy-search__num">{score != null ? score : '—'}</td> : null}
      {col('refPrice') ? <td className="pharmacy-search__num">{refPrice != null ? fmt(refPrice) : '—'}</td> : null}
      {col('fiscal') ? (
        <td className="pharmacy-search__mono pharmacy-search__clip pharmacy-search__fiscal" title={fiscal}>
          <span className="pharmacy-search__cell-text">{fiscal}</span>
        </td>
      ) : null}
      {onEditProduct || onDeactivateProduct ? (
        <td className="pharmacy-search__actions" onClick={(e) => e.stopPropagation()}>
          {onEditProduct ? (
            <button type="button" className="pharmacy-search__icon-btn" title={t('common.edit')} onClick={() => onEditProduct(product)}>
              <Pencil size={13} strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}
          {onDeactivateProduct ? (
            <button type="button" className="pharmacy-search__icon-btn pharmacy-search__icon-btn--danger" title={t('common.delete')} onClick={() => onDeactivateProduct(product)}>
              <Trash2 size={13} strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}
        </td>
      ) : null}
    </tr>
  );
}
