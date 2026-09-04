import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { logoutAndResetSession } from '../../../utils/authSession';
import { BaseButton } from '../../../components/ui';
import PosZoomControls from '../components/PosZoomControls';
import { useKitchenPosPage } from '../hooks/useKitchenPosPage';
import { usePosUiScale } from '../hooks/usePosUiScale';
import { KDS_COLUMNS } from '../utils/kitchenBoard';
import '../../shared/styles/restaurant-tokens.css';
import '../../shared/styles/rst-blocks.css';
import '../styles/floor-pos.css';
import '../styles/kitchen-kds.css';

export default function RestaurantKitchenPage() {
  const user = useAuthStore((s) => s.user);
  const p = useKitchenPosPage();
  const zoom = usePosUiScale();

  if (p.workspace.noAssignment) {
    return (
      <div className="rst-app rst-pos" style={zoom.rootStyle}>
        <div className="rst-notice">{p.t('rst.floor.noStore')}</div>
      </div>
    );
  }

  if (p.workspace.multipleAssignment) {
    return (
      <div className="rst-app rst-pos" style={zoom.rootStyle}>
        <div className="rst-notice">{p.t('rst.floor.pickStoreHint')}</div>
      </div>
    );
  }

  return (
    <div className="rst-app rst-pos" style={zoom.rootStyle}>
      <header className="rst-pos__top">
        <div className="rst-pos__brand">
          <span className="rst-pos__brand-name">{p.t('rst.kitchen.title')}</span>
          <span className="rst-pos__brand-meta">
            {p.workspace.storeName ?? p.t('rst.floor.hall')}
            {user?.fullName || user?.username ? ` · ${user.fullName || user.username}` : ''}
            {' · '}
            {p.shift ? p.t('rst.kitchen.shiftOpen') : p.t('rst.kitchen.shiftClosed')}
          </span>
        </div>
        <div className="rst-pos__actions">
          {p.canAdmin ? (
            <Link to="/rst/admin/stations">
              <BaseButton type="button" variant="ghost">{p.t('rst.pos.toAdmin')}</BaseButton>
            </Link>
          ) : null}
          <PosZoomControls zoom={zoom} t={p.t} />
          <BaseButton type="button" variant="ghost" onClick={() => logoutAndResetSession()}>
            {p.t('nav.logout')}
          </BaseButton>
        </div>
      </header>

      <div className="rst-kds">
        {p.isError ? <div className="rst-notice">{p.t('rst.kitchen.loadFailed')}</div> : null}
        {KDS_COLUMNS.map((status) => (
          <section key={status} className="rst-kds__col">
            <h2 className="rst-kds__col-title">
              {p.t(`rst.kitchen.status.${status}`)}
              <span>{p.columns[status].length}</span>
            </h2>
            <div className="rst-kds__cards">
              {p.columns[status].map((ticket) => (
                <article key={ticket.id} className="rst-kds-card">
                  <header className="rst-kds-card__head">
                    <strong>{p.t('rst.kitchen.table', { code: ticket.tableCode, no: ticket.orderNo })}</strong>
                    <span>{ticket.stationName || p.t('rst.kitchen.noStation')}</span>
                  </header>
                  <ul className="rst-kds-card__lines">
                    {(ticket.lines ?? []).map((line) => (
                      <li key={line.orderItemId}>
                        {Number(line.quantity)} × {line.name}
                        {line.note ? <em> — {line.note}</em> : null}
                      </li>
                    ))}
                  </ul>
                  {p.canAdvance ? (
                    <BaseButton
                      type="button"
                      disabled={p.advancing}
                      onClick={() => p.advance(ticket)}
                    >
                      {p.t(`rst.kitchen.action.${status}`)}
                    </BaseButton>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
