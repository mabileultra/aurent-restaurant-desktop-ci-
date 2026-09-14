import { Link } from 'react-router-dom';
import { BaseSelect } from '../../../../components/ui';
import { useStockFlowPaths } from '../../stockFlowPaths';
import StockDocumentStoreSelect from './StockDocumentStoreSelect';
import StockDocumentNotesField from './StockDocumentNotesField';

export default function StockReceiptMetaPanel({
  t,
  supplierId,
  onSupplierChange,
  supplierList,
  storeId,
  onStoreChange,
  stores,
  needsStorePick,
  notes,
  onNotesChange,
  paymentType,
  onPaymentTypeChange,
}) {
  const paths = useStockFlowPaths();

  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
      <div className="space-y-1.5">
        <BaseSelect
          label={t('stockReports.colSupplier')}
          value={supplierId}
          onChange={onSupplierChange}
          placeholder="—"
          options={[
            { value: '', label: '—' },
            ...supplierList.map((s) => ({ value: String(s.id), label: s.name })),
          ]}
        />
        {paths.suppliers ? (
          <Link to={paths.suppliers} className="text-xs font-semibold text-emerald-700 underline dark:text-emerald-400">
            {t('finance.expenses.addSupplier')}
          </Link>
        ) : null}
      </div>
      <StockDocumentStoreSelect
        label={t('stockReports.colStore')}
        value={storeId}
        onChange={onStoreChange}
        stores={stores}
        needsStorePick={needsStorePick}
        emptyLabel={needsStorePick ? t('stockModal.pickStore') : t('stockReports.allStores')}
      />
      <BaseSelect
        label={t('stockReports.paymentType')}
        value={paymentType}
        onChange={onPaymentTypeChange}
        options={[
          { value: 'CASH', label: t('stockReports.paymentCash') },
          { value: 'CREDIT', label: t('stockReports.paymentCredit') },
        ]}
      />
      <StockDocumentNotesField
        label={t('stockReports.writeOffNotes')}
        value={notes}
        onChange={onNotesChange}
      />
    </div>
  );
}
