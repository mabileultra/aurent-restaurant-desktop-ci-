import { Link } from 'react-router-dom';
import { BaseSelect } from '../../../../components/ui';
import { useStockFlowPaths } from '../../stockFlowPaths';

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
    <div className="rst-stock-doc-meta">
      <div className="rst-admin-field">
        <BaseSelect
          label={t('stockReports.colSupplier')}
          value={supplierId}
          onChange={onSupplierChange}
          placeholder="—"
          options={[
            { value: '', label: '—' },
            ...supplierList.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        {paths.suppliers ? (
          <Link to={paths.suppliers} className="rst-stock-doc-meta__link">
            {t('finance.expenses.addSupplier', { defaultValue: t('suppliersModule.add') })}
          </Link>
        ) : null}
      </div>

      {needsStorePick ? (
        <BaseSelect
          label={t('stockReports.colStore')}
          value={storeId}
          onChange={onStoreChange}
          placeholder={t('stockModal.pickStore')}
          options={[
            { value: '', label: t('stockModal.pickStore') },
            ...stores.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
      ) : null}

      <BaseSelect
        label={t('stockReports.paymentType')}
        value={paymentType}
        onChange={onPaymentTypeChange}
        searchable={false}
        options={[
          { value: 'CASH', label: t('stockReports.paymentCash') },
          { value: 'CREDIT', label: t('stockReports.paymentCredit') },
        ]}
      />

      <label className="rst-admin-field">
        <span className="rst-admin-field__label">{t('stockReports.writeOffNotes')}</span>
        <textarea
          className="form-select"
          rows={2}
          value={notes}
          onChange={onNotesChange}
        />
      </label>
    </div>
  );
}
