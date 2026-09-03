import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { rstShiftApi } from '../../api/shift.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/tech-card.css';

export default function ShiftsAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();

  const shiftsQuery = useQuery({
    queryKey: ['rst-shifts', workspace.storeId],
    queryFn: () => rstShiftApi.list(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  if (workspace.noAssignment) {
    return <div className="rst-notice">{t('rst.floor.noStore')}</div>;
  }

  return (
    <section>
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{t('rst.admin.shiftsTitle')}</h1>
          <p className="rst-coming__text mb-0">{t('rst.admin.shiftsSubtitle')}</p>
        </div>
      </div>

      {workspace.canPickStore ? (
        <label className="rst-shell__store d-block mb-3">
          <span className="d-block mb-1 small">{t('rst.admin.selectStore')}</span>
          <select
            className="form-select"
            value={workspace.pickedStoreId}
            onChange={(e) => workspace.setPickedStoreId(e.target.value)}
          >
            <option value="">{t('rst.admin.selectStore')}</option>
            {workspace.restaurantStores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      {shiftsQuery.isError ? <div className="rst-notice">{t('rst.admin.shiftsLoadFailed')}</div> : null}

      <table className="rst-tech__table">
        <thead>
          <tr>
            <th>{t('rst.admin.shiftStatus')}</th>
            <th>{t('rst.admin.shiftOpened')}</th>
            <th>{t('rst.admin.shiftClosed')}</th>
            <th>{t('rst.shift.sales')}</th>
            <th>{t('rst.shift.cash')}</th>
            <th>{t('rst.shift.card')}</th>
            <th>{t('rst.shift.total')}</th>
          </tr>
        </thead>
        <tbody>
          {(shiftsQuery.data ?? []).map((shift) => (
            <tr key={shift.id}>
              <td>{shift.status === 'OPEN' ? t('rst.shift.openLabel') : t('rst.shift.closedLabel')}</td>
              <td>{shift.openedAt ? new Date(shift.openedAt).toLocaleString() : '—'}</td>
              <td>{shift.closedAt ? new Date(shift.closedAt).toLocaleString() : '—'}</td>
              <td>{shift.saleCount}</td>
              <td>{fmtMoneyCompact(shift.cashAmount)}</td>
              <td>{fmtMoneyCompact(shift.cardAmount)}</td>
              <td>{fmtMoneyCompact(shift.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!shiftsQuery.isLoading && (shiftsQuery.data ?? []).length === 0 ? (
        <div className="rst-empty">{t('rst.admin.shiftsEmpty')}</div>
      ) : null}
    </section>
  );
}
