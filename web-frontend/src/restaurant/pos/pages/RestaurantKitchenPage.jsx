import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import { logoutAndResetSession } from '../../../utils/authSession';
import { BaseButton } from '../../../components/ui';
import PosZoomControls from '../components/PosZoomControls';
import KitchenTicketCard from '../components/KitchenTicketCard';
import { useKitchenPosPage } from '../hooks/useKitchenPosPage';
import { usePosUiScale } from '../hooks/usePosUiScale';
import { KDS_COLUMNS } from '../utils/kitchenBoard';
import { isTicketOverdue } from '../utils/kitchenTicketMeta';
import { formatShiftOpenDuration } from '../utils/formatElapsed';
import '../../shared/styles/restaurant-tokens.css';
import '../../shared/styles/rst-blocks.css';
import '../styles/floor-pos.css';
import '../styles/kitchen-kds.css';

function useNowTick(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

export default function RestaurantKitchenPage() {
  const user = useAuthStore((s) => s.user);
  const p = useKitchenPosPage();
  const zoom = usePosUiScale();
  const now = useNowTick();

  const stats = useMemo(() => {
    const all = KDS_COLUMNS.flatMap((status) => p.columns[status] || []);
    const inWork = all.length;
    const overdue = all.filter((ticket) => isTicketOverdue(ticket, now)).length;
    const ready = (p.columns.READY || []).length;
    return { inWork, overdue, ready };
  }, [p.columns, now]);

  useEffect(() => {
    const onKey = (event) => {
      if (!p.canAdvance || p.advancing) return;
      const target = event.target;
      const typing = target
        && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing) return;
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        const first = KDS_COLUMNS.map((status) => (p.columns[status] || [])[0]).find(Boolean);
        if (first) p.advance(first);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p]);

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

  const shiftLabel = p.shift
    ? `${p.t('rst.kitchen.shiftOpen')}${p.shift.openedAt ? ` · ${formatShiftOpenDuration(p.shift.openedAt, now)}` : ''}`
    : p.t('rst.kitchen.shiftClosed');

  return (
    <div className="rst-app rst-pos" style={zoom.rootStyle}>
      <header className="rst-pos__top">
        <div className="rst-pos__brand">
          <span className="rst-pos__brand-name">{p.t('rst.kitchen.osTitle')}</span>
          <span className="rst-pos__brand-meta">
            {p.workspace.storeName ?? p.t('rst.floor.hall')}
            {user?.fullName || user?.username ? ` · ${user.fullName || user.username}` : ''}
          </span>
        </div>
        <div className="rst-pos__actions">
          {p.canAdmin ? (
            <Link to="/rst/admin/stations">
              <BaseButton type="button" variant="ghost">{p.t('rst.pos.toAdmin')}</BaseButton>
            </Link>
          ) : null}
          <PosZoomControls zoom={zoom} t={p.t} />
          <span className="rst-pos__online">
            <span className="rst-pos__online-dot" aria-hidden />
            LIVE
          </span>
          <BaseButton type="button" variant="ghost" className="rst-pos__exit" onClick={() => logoutAndResetSession()}>
            {p.t('nav.logout')}
          </BaseButton>
        </div>
      </header>

      <div className="rst-kds-page">
        <div className="rst-kds-top">
          <div className="rst-kds-top__brand">
            <div className="rst-kds-top__name">
              <span className="rst-kds-top__mark">K</span>
              {p.t('rst.kitchen.osTitle')}
            </div>
            <div className="rst-kds-top__meta">
              {p.workspace.storeName ?? 'Aurent'}
              {' · '}
              <em>{p.t('rst.kitchen.hotShop')}</em>
              {' · '}
              {shiftLabel}
              {' · '}
              <span className="rst-kds-top__live">LIVE</span>
            </div>
          </div>

          <div className="rst-kds-stats">
            <div className="rst-kds-stat">
              <span>{p.t('rst.kitchen.statInWork')}</span>
              <strong>{stats.inWork}</strong>
            </div>
            <div className="rst-kds-stat rst-kds-stat--late">
              <span>{p.t('rst.kitchen.statOverdue')}</span>
              <strong>{stats.overdue}</strong>
            </div>
            <div className="rst-kds-stat">
              <span>{p.t('rst.kitchen.statReady')}</span>
              <strong>{stats.ready}</strong>
            </div>
          </div>

          <div className="rst-kds-top__actions">
            <button
              type="button"
              className="rst-kds-chef"
              onClick={() => toast(p.t('rst.kitchen.chefCallSent'))}
            >
              {p.t('rst.kitchen.chefCall')}
            </button>
          </div>
        </div>

        {p.isError ? <div className="rst-notice">{p.t('rst.kitchen.loadFailed')}</div> : null}

        <div className="rst-kds">
          {KDS_COLUMNS.map((status, index) => (
            <section key={status} className={`rst-kds__col rst-kds__col--${status}`}>
              <h2 className="rst-kds__col-title">
                <span className="rst-kds__col-dot" aria-hidden />
                {p.t(`rst.kitchen.status.${status}`)}
                <span className="rst-kds__col-count">{p.columns[status].length}</span>
                <span className="rst-kds__col-hotkey">[{index + 1}]</span>
              </h2>
              <div className="rst-kds__cards">
                {p.columns[status].map((ticket) => (
                  <KitchenTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    now={now}
                    waiterName={
                      ticket.waiterUserId
                        ? p.waiterNameById.get(String(ticket.waiterUserId))
                        : null
                    }
                    canAdvance={p.canAdvance}
                    advancing={p.advancing}
                    onAdvance={p.advance}
                    onChefCall={() => toast(p.t('rst.kitchen.chefCallSent'))}
                    t={p.t}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="rst-kds-foot">
          <div>{p.t('rst.kitchen.hwLine')}</div>
          <div className="rst-kds-foot__hints">
            <span><kbd>1-4</kbd> {p.t('rst.kitchen.hintColumns')}</span>
            <span><kbd>Space</kbd> {p.t('rst.kitchen.hintAdvance')}</span>
          </div>
          <div>{p.t('rst.kitchen.syncOk')}</div>
        </footer>
      </div>
    </div>
  );
}
