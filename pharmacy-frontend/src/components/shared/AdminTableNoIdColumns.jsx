import { useTranslation } from 'react-i18next';
import { tableRowNumber } from '../../utils/tableRowNumber';
import '../../styles/admin/table-id-columns.css';

/** Header cells: № + ID (pair at the start of admin tables). */
export function AdminTableNoIdHeaders({ rowSpan } = {}) {
  const { t } = useTranslation();
  return (
    <>
      <th className="admin-table-col-no" rowSpan={rowSpan}>{t('common.colNo')}</th>
      <th className="admin-table-col-id" rowSpan={rowSpan}>{t('common.colId')}</th>
    </>
  );
}

/** Body cells: № + ID for one row. */
export function AdminTableNoIdCells({ page = 0, pageSize = 0, index = 0, id }) {
  const displayId = id == null || id === '' ? '—' : String(id);
  return (
    <>
      <td className="admin-table-col-no admin-table-col-no--cell">
        {tableRowNumber(page, pageSize, index)}
      </td>
      <td className="admin-table-col-id admin-table-col-id--cell" title={displayId}>
        {displayId}
      </td>
    </>
  );
}
