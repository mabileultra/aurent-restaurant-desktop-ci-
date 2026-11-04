import TablePagination from '../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';

export default function ScalesPluTable({
  t,
  items,
  draftPlu,
  onDraftChange,
  onSave,
  savingId,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  if (!total) {
    return <div className="scales-plu-table__empty">{t('scales.noWeightProducts')}</div>;
  }

  return (
    <div className="scales-plu-table">
      <div className="scales-plu-table__scroll">
        <table>
          <thead>
            <tr>
              <AdminTableNoIdHeaders />
              <th>{t('scales.colName')}</th>
              <th>SKU</th>
              <th>{t('scales.colPrice')}</th>
              <th>PLU</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const draft = draftPlu[item.id] ?? item.plu ?? '';
              const dirty = String(draft) !== String(item.plu ?? '');
              return (
                <tr key={item.id}>
                  <AdminTableNoIdCells page={page} pageSize={pageSize} index={index} id={item.id} />
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.sellingPrice}</td>
                  <td>
                    <input
                      className="scales-plu-table__input"
                      inputMode="numeric"
                      maxLength={5}
                      value={draft}
                      onChange={(e) =>
                        onDraftChange(item.id, e.target.value.replace(/\D/g, '').slice(0, 5))
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="scales-btn scales-btn--ghost"
                      disabled={!dirty || savingId === item.id}
                      onClick={() => onSave(item.id, draft)}
                    >
                      {savingId === item.id ? t('scales.saving') : t('scales.savePlu')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
