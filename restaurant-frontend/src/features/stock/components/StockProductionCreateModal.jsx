import { Trash2 } from 'lucide-react';
import RstModal from '../../../restaurant/shared/components/RstModal';
import { ProductLookupSelect } from '../../../components/product-lookup';
import StockDocumentAddLineButton from './document-create/StockDocumentAddLineButton';
import { useStockProductionCreate } from '../hooks/useStockProductionCreate';
import '../styles/stock-doc-form.css';
import '../styles/stock-production-modal.css';

export default function StockProductionCreateModal({ open, onClose, onCreated }) {
  const m = useStockProductionCreate({ onCreated, onClose });

  return (
    <RstModal
      open={open}
      onClose={onClose}
      title={m.t('rst.stock.productionCreateTitle')}
      size="xl"
      cancelLabel={m.t('common.cancel')}
      submitLabel={m.isPending ? m.t('common.saving') : m.t('rst.stock.productionSubmit')}
      onSubmit={m.submit}
      isPending={m.isPending}
    >
      <div className="rst-modal-form rst-stock-doc-form">
        <p className="rst-stock-prd__note">{m.t('rst.stock.productionHint')}</p>
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
        <div className="rst-stock-prd__output">
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{m.t('rst.stock.productionOutput')}</span>
            <ProductLookupSelect
              source="warehouse"
              value={m.outputProductId}
              storeId={m.effectiveStoreId}
              disabled={!m.effectiveStoreId}
              onChange={(e) => m.setOutputProductId(e.target.value)}
              onProductSelect={(p) => {
                m.setOutputProductId(p?.id ? String(p.id) : '');
                if (p?.costPrice != null) m.setOutputCost(String(p.costPrice));
              }}
            />
          </label>
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{m.t('rst.stock.productionOutputQty')}</span>
            <input
              type="number"
              min={0.001}
              step="any"
              className="form-control"
              value={m.outputQty}
              onChange={(e) => m.setOutputQty(e.target.value)}
            />
          </label>
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{m.t('rst.stock.productionOutputCost')}</span>
            <input
              type="number"
              min={0}
              step="any"
              className="form-control"
              value={m.outputCost}
              onChange={(e) => m.setOutputCost(e.target.value)}
            />
          </label>
        </div>
        <div className="rst-stock-prd__inputs">
          <div className="rst-stock-prd__inputs-head">
            <strong>{m.t('rst.stock.productionInputs')}</strong>
            <StockDocumentAddLineButton label={m.t('stockReports.addLine')} onClick={m.addInput} />
          </div>
          <table>
            <thead>
              <tr>
                <th>{m.t('common.colNo')}</th>
                <th>{m.t('stockReports.pickProduct')}</th>
                <th>{m.t('stockReports.colQty')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {m.inputs.map((line, idx) => (
                <tr key={line.key ?? idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <ProductLookupSelect
                      source="warehouse"
                      size="sm"
                      value={line.productId}
                      storeId={m.effectiveStoreId}
                      disabled={!m.effectiveStoreId}
                      onChange={(e) => m.updateInput(idx, { productId: e.target.value })}
                      onProductSelect={(p) => m.updateInput(idx, { productId: p?.id ? String(p.id) : '' })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0.001}
                      step="any"
                      className="form-control"
                      value={line.quantity}
                      onChange={(e) => m.updateInput(idx, { quantity: e.target.value })}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="rst-stock-prd__remove"
                      disabled={m.inputs.length <= 1}
                      onClick={() => m.removeInput(idx)}
                      aria-label={m.t('common.delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
