import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LayoutDashboard, LogOut, MapPin } from 'lucide-react';
import { PHARM_DASHBOARD_PATH } from '../app/pharmacyPaths';
import PharmacyPosTabs from './PharmacyPosTabs';
import './pharmacy-pos-shell.css';

function registerLabel(shift, t) {
  const no = shift?.registerNumber ?? shift?.cashRegisterNumber ?? shift?.registerNo;
  if (no != null && no !== '') {
    return t?.('pos.registerNumber', { no, defaultValue: `Касса №${no}` }) || `Касса №${no}`;
  }
  return t?.('pos.register', { defaultValue: 'Касса' }) || 'Касса';
}

export default function PharmacyPosTopbar({
  storeName,
  shift,
  shiftOpenBadge,
  cashierName,
  canOpenOffice,
  openShift,
  onLogout,
}) {
  const { t } = useTranslation();
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
          <span className="pharmacy-pos-chrome__product">
            {t('productTemplates.businessTypes.PHARMACY', { defaultValue: 'Аптека' })}
          </span>
          <span className="pharmacy-pos-chrome__register">{registerLabel(shift, t)}</span>
        </div>
        <div className="pharmacy-pos-chrome__meta">
          <span className="pharmacy-pos-chrome__store">
            <MapPin size={14} strokeWidth={2} aria-hidden />
            {storeName || t('stores.retailPoint', { defaultValue: 'Торговая точка' })}
          </span>
          <span className={`pharmacy-pos-chrome__online${online ? ' is-on' : ''}`}>
            <i aria-hidden />
            {online
              ? t('offline.topbarOnline', { defaultValue: 'Онлайн' })
              : t('offline.topbarOffline', { defaultValue: 'Офлайн' })}
          </span>
          {shiftOpenBadge ? <span className="pharmacy-pos-chrome__time">{shiftOpenBadge}</span> : null}
        </div>
        <div className="pharmacy-pos-chrome__user">
          {canOpenOffice ? (
            <Link to={PHARM_DASHBOARD_PATH} className="pharmacy-pos-chrome__logout">
              <LayoutDashboard size={15} strokeWidth={2} aria-hidden />
              {t('nav.office', { defaultValue: 'В кабинет' })}
            </Link>
          ) : null}
          <span className="pharmacy-pos-chrome__avatar" aria-hidden>{initial}</span>
          <span className="pharmacy-pos-chrome__user-name">{cashierName || '—'}</span>
          <button type="button" className="pharmacy-pos-chrome__logout" onClick={onLogout}>
            <LogOut size={15} strokeWidth={2} aria-hidden />
            {t('nav.logout', { defaultValue: 'Выход' })}
          </button>
        </div>
      </div>
      <PharmacyPosTabs onOpenShift={openShift} />
    </header>
  );
}
