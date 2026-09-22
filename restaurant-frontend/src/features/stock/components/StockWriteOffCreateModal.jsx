import RstModal from '../../../restaurant/shared/components/RstModal';
import { ProductLookupSelect } from '../../../components/product-lookup';
import { useStockWriteOffCreate } from '../hooks/useStockWriteOffCreate';
import '../styles/stock-write-off-modal.css';

export default function StockWriteOffCreateModal({ open, onClose, onCreated, product = null }) {
  const m = useStockWriteOffCreate({ product, onCreated, onClose });

  return (
    <RstModal
      open={open}
      onClose={onClose}
      title={m.t('stockReports.writeOffTitle')}
      size="md"
      cancelLabel={m.t('common.cancel')}
      submitLabel={m.isPending ? m.t('common.saving') : m.t('stockReports.writeOffSubmit')}
      onSubmit={m.submit}
      isPending={m.isPending}
    >
      <div className="rst-modal-form">
        {m.productName ? (
          <p className="rst-stock-wo__hint">{m.productName}</p>
        ) : (
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{m.t('stockReports.pickProduct')}</span>
            <ProductLookupSelect
              source="warehouse"
              value={m.productId}
              storeId={m.effectiveStoreId}
              disabled={!m.effectiveStoreId}
              onChange={(e) => m.setProductId(e.target.value)}
              onProductSelect={(p) => m.setProductId(p?.id ? String(p.id) : '')}
            />
          </label>
        )}
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
          <span className="rst-admin-field__label">{m.t('stockReports.writeOffReason')}</span>
          <select className="form-select" value={m.reason} onChange={(e) => m.setReason(e.target.value)}>
            {m.reasons.map((r) => (
              <option key={r} value={r}>
                {m.t(`stockReports.reasons.${r}`, { defaultValue: r })}
              </option>
            ))}
          </select>
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
