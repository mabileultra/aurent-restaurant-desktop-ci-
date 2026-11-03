import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { logoutAndResetSession } from '../../../utils/authSession';
import { BaseButton } from '../../../components/ui';
import RestaurantWorkspaceEmpty from '../../shared/components/RestaurantWorkspaceEmpty';
import KitchenClassicBoard from '../components/KitchenClassicBoard';
import KitchenSimpleBoard from '../components/KitchenSimpleBoard';
import PosLoadRetry from '../components/PosLoadRetry';
import LanguageSwitcher from '../../../components/shared/LanguageSwitcher';
import RestaurantThemeSwitch from '../../shared/components/RestaurantThemeSwitch';
import PosSoundToggle from '../components/PosSoundToggle';
import { useKitchenPosPage } from '../hooks/useKitchenPosPage';
import { usePosUiScale } from '../hooks/usePosUiScale';
import { useKitchenMobileLayout } from '../kitchen-mobile/hooks/useKitchenMobileLayout';
import PosEnterMobileButton from '../pos-mobile/components/PosEnterMobileButton';
import toast from 'react-hot-toast';
import { openReadyDisplayWindow } from '../../ready-display/openReadyDisplayWindow';
import { KDS_COLUMNS } from '../utils/kitchenBoard';
import { SIMPLE_PHASES } from '../utils/kitchenSimpleBoard';
import { isTicketOverdue } from '../utils/kitchenTicketMeta';
import { formatShiftOpenDuration } from '../utils/formatElapsed';
import '../../shared/styles/restaurant-tokens.css';
import '../../shared/styles/rst-blocks.css';
import '../styles/floor-pos.css';
import '../styles/kitchen-kds.css';
import '../styles/kitchen-simple.css';
import '../kitchen-mobile/styles/kitchen-mobile-shell.css';

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
  const { hasModule } = useModuleAccess();
  const simpleMode = hasModule('restaurantReadyDisplay');
  const p = useKitchenPosPage({ simpleMode });
  const zoom = usePosUiScale();
  const mobile = useKitchenMobileLayout();
  const now = useNowTick();
  const [mobileStatus, setMobileStatus] = useState(KDS_COLUMNS[0]);

  const stats = useMemo(() => {
    if (simpleMode) {
      const all = SIMPLE_PHASES.flatMap((phase) => p.simplePhases[phase] || []);
      return {
        inWork: all.length,
        overdue: all.filter((ticket) => isTicketOverdue(ticket, now)).length,
        ready: (p.simplePhases.READY || []).length,
      };
    }
    const all = KDS_COLUMNS.flatMap((status) => p.columns[status] || []);
    return {
      inWork: all.length,
      overdue: all.filter((ticket) => isTicketOverdue(ticket, now)).length,
      ready: (p.columns.READY || []).length,
    };
  }, [simpleMode, p.simplePhases, p.columns, now]);

  useEffect(() => {
    if (simpleMode || !mobile.enabled) return;
    const firstWithTickets = KDS_COLUMNS.find((status) => (p.columns[status] || []).length > 0);
    if (firstWithTickets && !(p.columns[mobileStatus] || []).length) {
      setMobileStatus(firstWithTickets);
    }
  }, [simpleMode, mobile.enabled, p.columns, mobileStatus]);

  useEffect(() => {
    const onKey = (event) => {
      if (!p.canAdvance || p.advancing) return;
      const target = event.target;
      const typing = target
        && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing) return;
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        if (simpleMode) {
          const first = SIMPLE_PHASES.map((phase) => (p.simplePhases[phase] || [])[0]).find(Boolean);
          if (first) p.advance(first);
          return;
        }
        const first = KDS_COLUMNS.map((status) => (p.columns[status] || [])[0]).find(Boolean);
        if (first) p.advance(first);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p, simpleMode]);

  const rootClass = [
    'rst-app rst-pos',
    mobile.enabled ? 'rst-pos--kitchen-mobile' : '',
    simpleMode ? 'rst-pos--kitchen-simple' : '',
  ].filter(Boolean).join(' ');

  if (p.workspace.isLoading && p.workspace.storeId == null) {
    return (
      <div className={rootClass} style={zoom.rootStyle}>
        <div className="rst-notice">{p.t('common.loading')}</div>
      </div>
    );
  }

  if (!p.kitchenBoardLoading && !p.kitchenBoardEnabled) {
    return (
      <div className={rootClass} style={zoom.rootStyle}>
        <div className="rst-notice">{p.t('rst.kitchen.boardOff')}</div>
      </div>
    );
  }

  if (p.workspace.noAssignment || p.workspace.multipleAssignment || p.workspace.storeId == null) {
    return (
      <RestaurantWorkspaceEmpty
        t={p.t}
        workspace={p.workspace}
        zoomStyle={zoom.rootStyle}
        onLogout={() => logoutAndResetSession()}
      />
    );
  }

  const shiftLabel = p.shift
    ? `${p.t('rst.kitchen.shiftOpen')}${p.shift.openedAt ? ` · ${formatShiftOpenDuration(p.shift.openedAt, now)}` : ''}`
    : p.t('rst.kitchen.shiftClosed');

  const visibleColumns = mobile.enabled ? [mobileStatus] : KDS_COLUMNS;

  return (
    <div className={rootClass} style={zoom.rootStyle}>
      <header className="rst-pos__top">
        <div className="rst-pos__brand">
          <span className="rst-pos__brand-name">
            {simpleMode ? p.t('rst.kitchen.simple.title') : p.t('rst.kitchen.osTitle')}
          </span>
          <span className="rst-pos__brand-meta">
            {simpleMode ? (
              <>
                {p.workspace.storeName ?? 'Aurent'}
                {' · '}
                <em>{p.t('rst.kitchen.hotShop')}</em>
                {' · '}
                {shiftLabel}
                {' · '}
                <span className="rst-pos__brand-live">LIVE</span>
              </>
            ) : (
              <>
                {p.workspace.storeName ?? p.t('rst.floor.hall')}
                {user?.fullName || user?.username ? ` · ${user.fullName || user.username}` : ''}
              </>
            )}
          </span>
        </div>
        <div className="rst-pos__actions">
          {p.canAdmin ? (
            <Link to="/rst/admin/dashboard">
              <BaseButton type="button" variant="primary">{p.t('rst.pos.toAdmin')}</BaseButton>
            </Link>
          ) : null}
          {simpleMode ? (
            <BaseButton
              type="button"
              variant="ghost"
              onClick={() => {
                const result = openReadyDisplayWindow();
                if (result?.blocked) {
                  toast.error(p.t('rst.readyDisplay.popupBlocked'));
                }
              }}
            >
              {p.t('rst.readyDisplay.open')}
            </BaseButton>
          ) : null}
          <PosSoundToggle t={p.t} />
          <RestaurantThemeSwitch />
          <LanguageSwitcher variant="rst" />
          {mobile.showEnterMobile ? <PosEnterMobileButton onEnter={mobile.enterMobile} /> : null}
          {mobile.showExitMobile ? (
            <BaseButton type="button" variant="ghost" onClick={mobile.exitMobile}>
              {p.t('rst.mobile.exit')}
            </BaseButton>
          ) : null}
          {mobile.enabled || simpleMode ? null : (
            <span className="rst-pos__online">
              <span className="rst-pos__online-dot" aria-hidden />
              LIVE
            </span>
          )}
          <BaseButton type="button" variant="ghost" className="rst-exit-btn" onClick={() => logoutAndResetSession()}>
            {p.t('nav.logout')}
          </BaseButton>
        </div>
      </header>

      <div className="rst-kds-page">
        {simpleMode ? null : (
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
          </div>
        )}

        {p.isError ? (
          <PosLoadRetry t={p.t} messageKey="rst.kitchen.loadFailed" onRetry={p.refetch} />
        ) : null}

        {(p.stations?.length > 0) ? (
          <div className="rst-kds-stations" role="tablist" aria-label={p.t('rst.kitchen.stationsFilter')}>
            <button
              type="button"
              className={p.stationFilter === 'all' ? 'is-active' : ''}
              onClick={() => p.setStationFilter('all')}
            >
              {p.t('rst.kitchen.allStations')}
            </button>
            {p.stations.map((station) => (
              <button
                key={station.id}
                type="button"
                className={p.stationFilter === String(station.id) ? 'is-active' : ''}
                onClick={() => p.setStationFilter(String(station.id))}
              >
                {station.name}
              </button>
            ))}
          </div>
        ) : null}

        {simpleMode ? (
          <KitchenSimpleBoard
            phases={p.simplePhases}
            stats={stats}
            now={now}
            waiterNameById={p.waiterNameById}
            canAdvance={p.canAdvance}
            advancing={p.advancing}
            onAdvance={p.advance}
            t={p.t}
          />
        ) : (
          <KitchenClassicBoard
            columns={p.columns}
            visibleColumns={visibleColumns}
            mobile={mobile}
            mobileStatus={mobileStatus}
            setMobileStatus={setMobileStatus}
            now={now}
            waiterNameById={p.waiterNameById}
            canAdvance={p.canAdvance}
            advancing={p.advancing}
            onAdvance={p.advance}
            t={p.t}
          />
        )}

        {simpleMode ? null : (
          <footer className="rst-kds-foot">
            <div>{p.t('rst.kitchen.hwLine')}</div>
            <div className="rst-kds-foot__hints">
              <span><kbd>1-4</kbd> {p.t('rst.kitchen.hintColumns')}</span>
              <span><kbd>Space</kbd> {p.t('rst.kitchen.hintAdvance')}</span>
            </div>
            <div>{p.t('rst.kitchen.syncOk')}</div>
          </footer>
        )}
      </div>
    </div>
  );
}
