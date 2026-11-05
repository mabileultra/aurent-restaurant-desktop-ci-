import { useEffect, useState } from 'react';
import { LogOut, MapPin } from 'lucide-react';
import PharmacyPosTabs from './PharmacyPosTabs';
import './pharmacy-pos-shell.css';

function registerLabel(shift) {
  const no = shift?.registerNumber ?? shift?.cashRegisterNumber ?? shift?.registerNo;
  return no != null && no !== '' ? `Касса №${no}` : 'Касса';
}

export default function PharmacyPosTopbar({
  storeName,
  shift,
  shiftOpenBadge,
  cashierName,
  openShift,
  onLogout,
}) {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const initial = String(cashierName || 'A').trim().charAt(0).toUpperCase();

  return (
    <header className="pharmacy-pos-chrome">
      <div className="pharmacy-pos-chrome__bar">
        <div className="pharmacy-pos-chrome__brand">
          <span className="pharmacy-pos-chrome__mark" aria-hidden>N</span>
          <span className="pharmacy-pos-chrome__name">Aurent POS</span>
          <span className="pharmacy-pos-chrome__product">Аптека</span>
          <span className="pharmacy-pos-chrome__register">{registerLabel(shift)}</span>
        </div>
        <div className="pharmacy-pos-chrome__meta">
          <span className="pharmacy-pos-chrome__store">
            <MapPin size={14} strokeWidth={2} aria-hidden />
            {storeName || 'Торговая точка'}
          </span>
          <span className={`pharmacy-pos-chrome__online${online ? ' is-on' : ''}`}>
            <i aria-hidden />
            {online ? 'Онлайн' : 'Офлайн'}
          </span>
          {shiftOpenBadge ? <span className="pharmacy-pos-chrome__time">{shiftOpenBadge}</span> : null}
        </div>
        <div className="pharmacy-pos-chrome__user">
          <span className="pharmacy-pos-chrome__avatar" aria-hidden>{initial}</span>
          <span className="pharmacy-pos-chrome__user-name">{cashierName || '—'}</span>
          <button type="button" className="pharmacy-pos-chrome__logout" onClick={onLogout}>
            <LogOut size={15} strokeWidth={2} aria-hidden />
            Выход
          </button>
        </div>
      </div>
      <PharmacyPosTabs onOpenShift={openShift} />
    </header>
  );
}
