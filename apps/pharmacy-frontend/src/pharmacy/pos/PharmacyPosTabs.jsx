import { NavLink } from 'react-router-dom';
import {
  Archive,
  ArrowLeftRight,
  Ban,
  Banknote,
  BarChart3,
  Clock,
  Receipt,
  Search,
  Settings,
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { usePharmacyPosActions } from './pharmacyPosActions';

const TABS = [
  { id: 'checks', action: 'checks', icon: Receipt, label: 'Чеки' },
  { id: 'parked', action: 'parked', icon: Archive, label: 'Отложенные' },
  { id: 'shift', action: 'shift', icon: Clock, label: 'Смена' },
  { id: 'cash', action: 'cash', icon: Banknote, label: 'Денежные операции' },
  { id: 'branches', action: 'branches', icon: Search, label: 'Поиск по филиалам' },
  { id: 'reports', to: '/reports', icon: BarChart3, label: 'Отчеты' },
  { id: 'reject', action: 'reject', icon: Ban, label: 'Отказ' },
  { id: 'move', to: '/stock/transfers/new', icon: ArrowLeftRight, label: 'Перемещение' },
  { id: 'settings', action: 'settings', icon: Settings, label: 'Настройки' },
];

export default function PharmacyPosTabs({ onOpenShift }) {
  const actions = usePharmacyPosActions();
  const parkedCount = useCartStore((s) => s.parkedCarts?.length || 0);

  return (
    <nav className="pharmacy-pos-tabs" aria-label="Разделы кассы">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        if (tab.action === 'shift') {
          return (
            <button key={tab.id} type="button" className="pharmacy-pos-tabs__item" onClick={onOpenShift}>
              <Icon size={15} strokeWidth={2} aria-hidden />
              <span>{tab.label}</span>
            </button>
          );
        }
        if (tab.action) {
          return (
            <button
              key={tab.id}
              type="button"
              className="pharmacy-pos-tabs__item"
              onClick={() => actions?.run(tab.action)}
            >
              <Icon size={15} strokeWidth={2} aria-hidden />
              <span>{tab.label}</span>
              {tab.id === 'parked' && parkedCount > 0 ? (
                <span className="pharmacy-pos-tabs__count">{parkedCount}</span>
              ) : null}
            </button>
          );
        }
        return (
          <NavLink
            key={tab.id}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `pharmacy-pos-tabs__item${isActive ? ' is-active' : ''}`}
          >
            <Icon size={15} strokeWidth={2} aria-hidden />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
