import PharmacyReceiptDocumentMenu from './PharmacyReceiptDocumentMenu';
import { PharmacyStatusBadge } from './PharmacyStockLayout';
import { formatMoney } from '../utils/pharmacyReceiptPricing';
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

      <Meta label={t('pharmacyStock.receiptType')} value={t('pharmacyStock.receiptTypeReceipt')} />
      <Meta label={t('pharmacyStock.colStatus')} value={<PharmacyStatusBadge status={receipt.status} t={t} />} />
      <Meta label={t('pharmacyStock.colDocNo')} value={receipt.receiptNumber} />
      <Meta label={t('pharmacyStock.colDate')} value={receipt.documentDate || '—'} />
      <Meta label={t('pharmacyStock.markup')} value={receipt.defaultMarkupPercent ?? '—'} />
      <Meta label={t('stockReports.colStore')} value={receipt.storeName || '—'} />

      <div>
        <p className="pharmacy-stock__section-title">{t('pharmacyStock.invoiceSection')}</p>
        <Meta label={t('stockReports.colSupplier')} value={receipt.supplierName || '—'} />
        <Meta label={t('pharmacyStock.invoiceNumber')} value={receipt.invoiceNumber || '—'} />
        <Meta label={t('pharmacyStock.invoiceDate')} value={receipt.invoiceDate || '—'} />
        <Meta label={t('pharmacyStock.contractNumber')} value={receipt.contractNumber || '—'} />
        <Meta label={t('pharmacyStock.financialDiscount')} value={receipt.financialDiscount ?? '—'} />
      </div>

      <div>
        <p className="pharmacy-stock__section-title">{t('pharmacyStock.colLines')}</p>
        <Meta label={t('pharmacyStock.colLines')} value={receipt.lineCount ?? receipt.lines?.length ?? 0} />
        <Meta label={t('pharmacyStock.colPurchaseSum')} value={formatMoney(receipt.totalCost)} />
        <Meta label={t('pharmacyStock.colRetailSum')} value={formatMoney(receipt.totalRetail)} />
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
