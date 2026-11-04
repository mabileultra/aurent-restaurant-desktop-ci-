import { ArrowLeft, Plus } from 'lucide-react';
import { format as fmtDate } from 'date-fns';
import { BaseButton } from '../../../components/ui';
import IngredientModal from '../../catalog/components/products/IngredientModal';
import StockReceiptMetaPanel from '../components/document-create/StockReceiptMetaPanel';
import StockReceiptLinesEditor from '../components/document-create/StockReceiptLinesEditor';
import StockReceiptLinesView from '../components/document-create/StockReceiptLinesView';
import { useStockReceiptDocumentPage } from '../hooks/useStockReceiptDocumentPage';
import { fmtMoney } from '../../../utils/formatMoney';
import '../styles/stock-doc-form.css';
import '../styles/stock-receipt-document.css';

export default function StockReceiptDocumentPage() {
  const p = useStockReceiptDocumentPage();

  if (!p.isNew && p.receiptLoading) {
    return (
      <div className="rst-stock-receipt-doc">
        <p className="rst-coming__text">{p.t('common.loading')}</p>
      </div>
    );
  }

  if (!p.isNew && (p.receiptError || !p.receipt)) {
    return (
      <div className="rst-stock-receipt-doc">
        <p className="rst-notice">{p.t('stockReports.loadFailed', { defaultValue: p.t('common.error') })}</p>
        <BaseButton type="button" variant="secondary" onClick={p.backToList}>
          {p.t('common.backToList')}
        </BaseButton>
      </div>
    );
  }

  const title = p.isNew
    ? p.t('stockReports.receiptCreateTitle')
    : p.t('stockReports.receiptDocTitle', { no: p.receipt.receiptNumber });

  return (
    <div className="rst-stock-receipt-doc">
      <div className="rst-stock-receipt-doc__toolbar">
        <div className="rst-stock-receipt-doc__heading">
          <button
            type="button"
            className="rst-stock-receipt-doc__back"
            onClick={p.backToList}
            aria-label={p.t('common.backToList')}
          >
            <ArrowLeft size={18} aria-hidden />
          </button>
          <div>
            <h1 className="rst-coming__title">{title}</h1>
            <p className="rst-coming__text mb-0">
              {p.isNew
                ? p.t('stockReports.receiptDocSubtitle')
                : p.t('stockReports.receiptDocPostedHint', {
                  date: p.receipt.createdAt
                    ? fmtDate(new Date(p.receipt.createdAt), 'dd.MM.yyyy HH:mm')
                    : '—',
                })}
            </p>
          </div>
        </div>
        {p.isNew ? (
          <BaseButton type="button" onClick={p.submit} disabled={p.isPending}>
            {p.isPending ? p.t('common.saving') : p.t('stockReports.receiptSubmit')}
          </BaseButton>
        ) : null}
      </div>

      {p.isNew ? (
        <>
          <StockReceiptMetaPanel
            t={p.t}
            supplierId={p.supplierId}
            onSupplierChange={(e) => p.setSupplierId(e.target.value)}
            supplierList={p.supplierList}
            storeId={p.storeId}
            onStoreChange={(e) => p.setStoreId(e.target.value)}
            stores={p.stores}
            needsStorePick={p.needsStorePick}
            notes={p.notes}
            onNotesChange={(e) => p.setNotes(e.target.value)}
            paymentType={p.paymentType}
            onPaymentTypeChange={(e) => p.setPaymentType(e.target.value)}
          />
          <StockReceiptLinesEditor
            t={p.t}
            lines={p.lines}
            storeId={p.effectiveStoreId}
            onProductPick={p.onProductPick}
            updateLine={p.updateLine}
            addLine={p.addLine}
            removeLine={p.removeLine}
            removeSelectedLines={p.removeSelectedLines}
            replaceLines={p.replaceLines}
            onCreateProduct={p.openCreateProduct}
          />
        </>
      ) : (
        <>
          <div className="rst-stock-doc-meta rst-stock-receipt-doc__meta-view">
            <div>
              <span className="rst-admin-field__label">{p.t('stockReports.colSupplier')}</span>
              <strong>{p.receipt.supplierName || '—'}</strong>
            </div>
            <div>
              <span className="rst-admin-field__label">{p.t('stockReports.colStore')}</span>
              <strong>{p.receipt.storeName || '—'}</strong>
            </div>
            <div>
              <span className="rst-admin-field__label">{p.t('stockReports.writeOffNotes')}</span>
              <strong>{p.receipt.notes || '—'}</strong>
            </div>
            <div>
              <span className="rst-admin-field__label">{p.t('stockReports.colUser', { defaultValue: 'Автор' })}</span>
              <strong>{p.receipt.createdByName || '—'}</strong>
            </div>
          </div>
          <StockReceiptLinesView t={p.t} lines={p.receipt.lines ?? []} />
        </>
      )}

      <footer className="rst-stock-receipt-doc__footer">
        <div>
          <span>{p.t('stockReports.linesCount', { count: p.lineTotals.count })}</span>
          <span>·</span>
          <span>{p.t('stockReports.colQty')}: <strong>{p.lineTotals.qty}</strong></span>
        </div>
        <div className="rst-stock-receipt-doc__total">
          {p.t('stockReports.colAmount')}: <strong>{fmtMoney(p.isNew ? p.lineTotals.amount : p.receipt.totalCost)}</strong>
        </div>
        {p.isNew ? (
          <BaseButton type="button" onClick={p.submit} disabled={p.isPending}>
            <Plus size={16} aria-hidden />
            {p.isPending ? p.t('common.saving') : p.t('stockReports.receiptSubmit')}
          </BaseButton>
        ) : null}
      </footer>

      <IngredientModal
        open={p.createLineIdx != null}
        product={null}
        categories={p.categories}
        selectedStore={p.createStore}
        defaultProductType="RETAIL"
        mode="receipt"
        onClose={p.closeCreateProduct}
        onSaved={p.onProductCreated}
      />
    </div>
  );
}
