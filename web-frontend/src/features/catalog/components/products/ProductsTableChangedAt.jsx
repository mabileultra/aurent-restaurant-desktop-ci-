import { useTranslation } from 'react-i18next';
import { tableRowNumber } from '../../../../utils/tableRowNumber';
import { formatAdminDateTime } from '../../../../utils/formatAdminDateTime';
import '../../../../styles/admin/table-id-columns.css';
import '../../../../styles/admin/table-date-columns.css';

/** Header: № + last change date (instead of UUID ID). */
export function ProductsTableChangedAtHeaders({ rowSpan } = {}) {
  const { t } = useTranslation();
  return (
    <>
      <th className="admin-table-col-no" rowSpan={rowSpan}>{t('common.colNo')}</th>
      <th className="admin-table-col-date" rowSpan={rowSpan}>{t('products.colChangedAt')}</th>
    </>
  );
}

/** Body: № + updatedAt (fallback createdAt). */
export function ProductsTableChangedAtCells({ page = 0, pageSize = 0, index = 0, updatedAt, createdAt }) {
  const iso = updatedAt || createdAt;
  const display = formatAdminDateTime(iso);
  return (
    <>
      <td className="admin-table-col-no admin-table-col-no--cell">
        {tableRowNumber(page, pageSize, index)}
      </td>
      <td className="admin-table-col-date admin-table-col-date--cell" title={display}>
        {display}
      </td>
    </>
  );
}
