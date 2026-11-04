import PharmacyReceiptDocumentMenu from './PharmacyReceiptDocumentMenu';
import { PharmacyStatusBadge } from './PharmacyStockLayout';
import { formatMoney } from '../utils/pharmacyReceiptPricing';
import { receiptDisplayTotals } from '../utils/pharmacyReceiptTotals';
import {
  paymentTypeLabel,
  receiptTypeLabel,
} from '../utils/pharmacyReceiptDisplayMeta';
import '../styles/pharmacy-receipt-document-card.css';

export default function PharmacyReceiptDocumentCard({
  t,
  receipt,
  canEdit,
  onEdit,
  onDelete,
  onClose,
  deleteDisabled,
}) {
  const totals = receiptDisplayTotals(receipt);
  const payment = paymentTypeLabel(receipt.paymentType, t);

  return (
    <aside className="pharmacy-stock__aside pharmacy-receipt-document-card">
      <div className="pharmacy-receipt-document-card__head">
        <PharmacyReceiptDocumentMenu
          t={t}
          canEdit={canEdit}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={onClose}
          deleteDisabled={deleteDisabled}
        />
      </div>

      <Meta label={t('pharmacyStock.receiptType')} value={receiptTypeLabel(receipt.receiptType, t)} />
      <Meta label={t('pharmacyStock.colStatus')} value={<PharmacyStatusBadge status={receipt.status} t={t} />} />
      <Meta label={t('pharmacyStock.colDocNo')} value={receipt.receiptNumber} />
      <Meta label={t('pharmacyStock.colDate')} value={receipt.documentDate || '—'} />
      <Meta label={t('pharmacyStock.markup')} value={receipt.defaultMarkupPercent ?? '—'} />
      <Meta label={t('stockReports.colStore')} value={receipt.storeName || '—'} />
      {payment ? <Meta label={t('pharmacyStock.paymentType')} value={payment} /> : null}

      <div>
        <p className="pharmacy-stock__section-title">{t('pharmacyStock.invoiceSection')}</p>
        <Meta label={t('stockReports.colSupplier')} value={receipt.supplierName || '—'} />
        <Meta label={t('pharmacyStock.invoiceNumber')} value={receipt.invoiceNumber || '—'} />
        <Meta label={t('pharmacyStock.invoiceDate')} value={receipt.invoiceDate || '—'} />
        <Meta label={t('pharmacyStock.contractNumber')} value={receipt.contractNumber || '—'} />
        <Meta
          label={t('pharmacyStock.financialDiscount')}
          value={receipt.financialDiscount != null && receipt.financialDiscount !== ''
            ? formatMoney(receipt.financialDiscount)
            : '—'}
        />
      </div>

      <div>
        <p className="pharmacy-stock__section-title">{t('pharmacyStock.colLines')}</p>
        <Meta label={t('pharmacyStock.colLines')} value={totals.lineCount} />
        <Meta label={t('pharmacyStock.colPurchaseSum')} value={formatMoney(totals.purchase)} />
        <Meta label={t('pharmacyStock.colRetailSum')} value={formatMoney(totals.retail)} />
      </div>

      {receipt.createdByName ? (
        <p className="pharmacy-stock__foot-note">
          {receipt.createdByName}
          {receipt.createdAt ? ` · ${new Date(receipt.createdAt).toLocaleString('ru-RU')}` : ''}
        </p>
      ) : null}
    </aside>
  );
}

function Meta({ label, value }) {
  return (
    <div className="pharmacy-stock__meta">
      <div className="pharmacy-stock__meta-label">{label}</div>
      <div className="pharmacy-stock__meta-value">{value}</div>
    </div>
  );
}
