import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BaseButton, BaseInput } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { rstAnalyticsApi } from '../../api/analytics.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/analytics-admin.css';

function toDateInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatActivity(t, event) {
  const parts = String(event.summary ?? '').split('|');
  switch (event.type) {
    case 'PAYMENT':
      return t('rst.audit.evtPayment', {
        method: parts[0],
        amount: fmtMoneyCompact(parts[1]),
        orderNo: parts[2],
      });
    case 'ORDER_OPEN':
      return t('rst.audit.evtOrderOpen', { orderNo: event.summary });
    case 'ORDER_CLOSE':
      return t('rst.audit.evtOrderClose', { orderNo: event.summary });
    case 'ORDER_CANCEL':
      return t('rst.audit.evtOrderCancel', { orderNo: event.summary });
    case 'SHIFT_OPEN':
      return t('rst.audit.evtShiftOpen', { cash: fmtMoneyCompact(event.summary) });
    case 'SHIFT_CLOSE':
      return t('rst.audit.evtShiftClose', { revenue: fmtMoneyCompact(event.summary) });
    case 'RESERVATION':
      return t('rst.audit.evtReservation', {
        status: parts[0],
        client: parts[1],
        table: parts[2],
      });
    default:
      return event.summary;
  }
}

export default function AuditAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const [fromDate, setFromDate] = useState(() => toDateInput(new Date()));
  const [toDate, setToDate] = useState(() => toDateInput(new Date()));

  const params = useMemo(() => {
    const from = new Date(`${fromDate}T00:00:00`);
    const to = new Date(`${toDate}T00:00:00`);
    to.setDate(to.getDate() + 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [fromDate, toDate]);

  const activityQuery = useQuery({
    queryKey: ['rst-activity', workspace.storeId, params],
    queryFn: () => rstAnalyticsApi.activity(workspace.storeId, params).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  if (workspace.noAssignment) {
    return <div className="rst-notice">{t('rst.floor.noStore')}</div>;
  }

  return (
    <section>
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{t('rst.admin.auditTitle')}</h1>
          <p className="rst-coming__text mb-0">{t('rst.admin.auditSubtitle')}</p>
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

      {!workspace.storeId ? (
        <div className="rst-notice">{t('rst.admin.selectStore')}</div>
      ) : (
        <>
          <div className="rst-report__filters">
            <label>
              {t('rst.reports.from')}
              <BaseInput type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </label>
            <label>
              {t('rst.reports.to')}
              <BaseInput type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </label>
            <BaseButton type="button" variant="ghost" onClick={() => activityQuery.refetch()}>
              {t('common.refresh')}
            </BaseButton>
          </div>

          {activityQuery.isError ? <div className="rst-notice">{t('rst.admin.auditLoadFailed')}</div> : null}

          {activityQuery.isPending ? (
            <div className="rst-empty">{t('common.loading')}</div>
          ) : (activityQuery.data ?? []).length === 0 ? (
            <div className="rst-empty">{t('rst.audit.empty')}</div>
          ) : (
            <div className="rst-audit__list">
              {(activityQuery.data ?? []).map((event) => (
                <div key={`${event.type}-${event.entityId}-${event.at}`} className="rst-audit__row">
                  <div className="rst-audit__time">{new Date(event.at).toLocaleString()}</div>
                  <div className="rst-audit__type">{t(`rst.audit.type_${event.type}`, { defaultValue: event.type })}</div>
                  <div>{formatActivity(t, event)}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
