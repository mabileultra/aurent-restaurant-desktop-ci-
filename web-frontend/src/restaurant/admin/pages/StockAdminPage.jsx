import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { useStockAdminPage } from '../hooks/useStockAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/tech-card.css';

export default function StockAdminPage() {
  const p = useStockAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section>
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.stockTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.stockSubtitle')}</p>
        </div>
      </div>

      {p.workspace.canPickStore ? (
        <label className="rst-shell__store d-block mb-3">
          <span className="d-block mb-1 small">{p.t('rst.admin.selectStore')}</span>
          <select
            className="form-select"
            value={p.workspace.pickedStoreId}
            onChange={(e) => p.workspace.setPickedStoreId(e.target.value)}
          >
            <option value="">{p.t('rst.admin.selectStore')}</option>
            {p.workspace.restaurantStores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      {p.isError ? <div className="rst-notice">{p.t('rst.admin.stockLoadFailed')}</div> : null}

      <table className="rst-tech__table">
        <thead>
          <tr>
            <th>{p.t('rst.admin.ingredient')}</th>
            <th>{p.t('rst.admin.sku')}</th>
            <th>{p.t('rst.admin.stockQty')}</th>
            <th>{p.t('rst.admin.cost')}</th>
          </tr>
        </thead>
        <tbody>
          {p.items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.sku || '—'}</td>
              <td>{item.stockQuantity}</td>
              <td>{fmtMoneyCompact(item.costPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
