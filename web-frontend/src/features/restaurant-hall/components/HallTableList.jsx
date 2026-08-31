import { BaseButton } from '../../../components/ui';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import '../../restaurant-shared/styles/restaurant-panel.css';
import '../styles/hall-table-list.css';

export default function HallTableList({ tables, onEditTable, onDeleteTable, t }) {
  if (!tables.length) {
    return <p className="hall-table-list__empty">{t('restaurantHall.noTables')}</p>;
  }

  return (
    <div className="hall-table-list">
      <table className="restaurant-data-table">
        <thead>
          <tr>
            <AdminTableNoIdHeaders />
            <th>{t('restaurantHall.tableCode')}</th>
            <th>{t('restaurantHall.tableLabel')}</th>
            <th>{t('restaurantHall.seatCount')}</th>
            <th>{t('restaurantHall.status')}</th>
            <th className="restaurant-data-table__actions">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {tables.map((table, index) => (
            <tr key={table.id}>
              <AdminTableNoIdCells page={0} pageSize={tables.length || 1} index={index} id={table.id} />
              <td className="hall-table-list__code">{table.code}</td>
              <td>{table.label || '—'}</td>
              <td>{table.seatCount}</td>
              <td>
                <span className={`hall-table-list__status hall-table-list__status--${table.status}`}>
                  {t(`restaurantHall.status_${table.status}`)}
                </span>
              </td>
              <td className="restaurant-data-table__actions">
                <BaseButton size="sm" variant="ghost" onClick={() => onEditTable(table)}>
                  {t('common.edit')}
                </BaseButton>
                <BaseButton size="sm" variant="ghost" onClick={() => onDeleteTable(table)}>
                  {t('common.delete')}
                </BaseButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
