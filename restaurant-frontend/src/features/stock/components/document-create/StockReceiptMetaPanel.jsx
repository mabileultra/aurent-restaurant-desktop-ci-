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
      <label className="rst-admin-field">
        <span className="rst-admin-field__label">{t('stockReports.colSupplier')}</span>
        <select className="form-select" value={supplierId} onChange={onSupplierChange}>
          <option value="">—</option>
          {supplierList.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {paths.suppliers ? (
          <Link to={paths.suppliers} className="rst-stock-doc-meta__link">
            {t('finance.expenses.addSupplier', { defaultValue: t('suppliersModule.add') })}
          </Link>
        ) : null}
      </label>

      {needsStorePick ? (
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{t('stockReports.colStore')}</span>
          <select className="form-select" value={storeId} onChange={onStoreChange}>
            <option value="">{t('stockModal.pickStore')}</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      <BaseSelect
        label={t('stockReports.paymentType')}
        value={paymentType}
        onChange={onPaymentTypeChange}
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
