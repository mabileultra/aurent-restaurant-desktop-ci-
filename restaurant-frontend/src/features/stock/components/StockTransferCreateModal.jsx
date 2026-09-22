import { Trash2 } from 'lucide-react';
import RstModal from '../../../restaurant/shared/components/RstModal';
import { ProductLookupSelect } from '../../../components/product-lookup';
import StockDocumentAddLineButton from './document-create/StockDocumentAddLineButton';
import { useStockTransferCreate } from '../hooks/useStockTransferCreate';
import '../styles/stock-doc-form.css';
import '../styles/stock-transfer-modal.css';

export default function StockTransferCreateModal({ open, onClose, onCreated }) {
  const m = useStockTransferCreate({ onCreated, onClose });

  return (
    <RstModal
      open={open}
      onClose={onClose}
      title={m.t('stockReports.transferCreateTitle')}
      size="xl"
      cancelLabel={m.t('common.cancel')}
      submitLabel={m.isPending ? m.t('common.saving') : m.t('stockReports.transferSubmit')}
      onSubmit={m.submit}
      isPending={m.isPending}
    >
      <div className="rst-modal-form rst-stock-doc-form">
        <p className="rst-stock-tr__note">{m.t('stockReports.transferNote')}</p>
        <div className="rst-stock-tr__stores">
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{m.t('stockReports.fromStore')}</span>
            <select
              className="form-select"
              value={m.fromStoreId}
              onChange={(e) => m.setFromStoreId(e.target.value)}
            >
              <option value="">{m.t('stockModal.pickStore')}</option>
              {m.stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{m.t('stockReports.toStore')}</span>
            <select
              className="form-select"
              value={m.toStoreId}
              onChange={(e) => m.setToStoreId(e.target.value)}
            >
              <option value="">{m.t('stockModal.pickStore')}</option>
              {m.stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
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
        <div className="rst-stock-tr__lines">
          <div className="rst-stock-tr__lines-head">
            <strong>{m.t('stockReports.transferLines')}</strong>
            <StockDocumentAddLineButton label={m.t('stockReports.addLine')} onClick={m.addLine} />
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
              {m.lines.map((line, idx) => (
                <tr key={line.key ?? idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <ProductLookupSelect
                      source="warehouse"
                      size="sm"
                      value={line.productId}
                      storeId={m.fromStoreId ? Number(m.fromStoreId) : undefined}
                      disabled={!m.fromStoreId}
                      onChange={(e) => m.updateLine(idx, { productId: e.target.value })}
                      onProductSelect={(p) => m.updateLine(idx, { productId: p?.id ? String(p.id) : '' })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0.001}
                      step="any"
                      className="form-control"
                      value={line.quantity}
                      onChange={(e) => m.updateLine(idx, { quantity: e.target.value })}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="rst-stock-tr__remove"
                      disabled={m.lines.length <= 1}
                      onClick={() => m.removeLine(idx)}
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
      </div>
    </RstModal>
  );
}
