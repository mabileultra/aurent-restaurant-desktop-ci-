import RstModal from '../../../restaurant/shared/components/RstModal';
import { ProductLookupSelect } from '../../../components/product-lookup';
import { useStockExpenseCreate } from '../hooks/useStockExpenseCreate';
import '../styles/stock-expense-modal.css';

/** Расход — через общий RstModal (BaseModal), без отдельного panel-shell. */
export default function StockExpenseCreateModal({ open, onClose, onCreated }) {
  const m = useStockExpenseCreate({ onCreated, onClose });

  return (
    <RstModal
      open={open}
      onClose={onClose}
      title={m.t('rst.stock.expenseCreateTitle')}
      size="md"
      cancelLabel={m.t('common.cancel')}
      submitLabel={m.isPending ? m.t('common.saving') : m.t('rst.stock.expenseSubmit')}
      onSubmit={m.submit}
      isPending={m.isPending}
    >
      <div className="rst-modal-form rst-expense-modal">
        {m.needsStorePick ? (
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{m.t('stockReports.colStore')}</span>
            <select className="form-select" value={m.storeId} onChange={(e) => m.setStoreId(e.target.value)}>
              <option value="">{m.t('stockModal.pickStore')}</option>
              {m.stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{m.t('stockReports.pickProduct')}</span>
          <ProductLookupSelect
            source="warehouse"
            value={m.productId}
            storeId={m.effectiveStoreId}
            disabled={!m.effectiveStoreId}
            onChange={(e) => {
              if (!e.target.value) m.selectProduct(null);
            }}
            onProductSelect={m.selectProduct}
          />
          {m.product?.stockQuantity != null ? (
            <span className="rst-expense-modal__stock-hint">
              {m.t('rst.stock.expenseAvailable', {
                defaultValue: 'На складе: {{qty}}',
                qty: m.product.stockQuantity,
              })}
            </span>
          ) : null}
        </label>
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{m.t('stockReports.writeOffQty')}</span>
          <input
            type="number"
            min={0.001}
            step="any"
            className="form-control"
            value={m.quantity}
            onChange={(e) => m.setQuantity(e.target.value)}
          />
        </label>
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{m.t('rst.stock.expenseReason')}</span>
          <select
            className="form-select"
            value={m.expenseReason}
            onChange={(e) => m.setExpenseReason(e.target.value)}
          >
            {m.expenseReasons.map((r) => (
              <option key={r} value={r}>{m.t(`rst.stock.expenseReasons.${r}`)}</option>
            ))}
          </select>
        </label>
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{m.t('rst.stock.expenseRecipient')}</span>
          <input
            type="text"
            className="form-control"
            value={m.recipient}
            onChange={(e) => m.setRecipient(e.target.value)}
            placeholder={m.t('rst.stock.expenseRecipientPh', { defaultValue: 'Кухня / бар / подразделение' })}
          />
        </label>
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{m.t('stockReports.writeOffNotes')}</span>
          <textarea
            className="form-control"
            rows={2}
            value={m.notes}
            onChange={(e) => m.setNotes(e.target.value)}
          />
        </label>
      </div>
    </RstModal>
  );
}
