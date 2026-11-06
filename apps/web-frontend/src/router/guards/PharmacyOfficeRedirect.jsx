import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCompanyBusinessType } from '../../hooks/useCompanyBusinessType';
import { isPharmacyAppSplitEnabled } from '../../config/pharmacyAppUrl';
import { redirectToPharmacyApp } from '../../utils/redirectToPharmacyApp';

const OFFICE_PREFIXES = [
  '/dashboard',
  '/finance',
  '/cash-registers',
  '/users',
  '/stores',
  '/billing',
  '/reports',
  '/assistant',
  '/products',
  '/categories',
  '/stock',
  '/orders',
  '/scales',
];

function isPharmacyOfficePath(pathname) {
  const p = String(pathname || '');
  if (p.startsWith('/cashier') || p.startsWith('/login') || p.startsWith('/install') || p.startsWith('/platform')) {
    return false;
  }
  return OFFICE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/**
 * Аптечный бэк-офис на p-aurent. На aurent остаются login / cashier (force-update) / install / platform.
 */
export default function PharmacyOfficeRedirect({ children }) {
  const { pathname, search } = useLocation();
  const { isPharmacyCompany, isLoading } = useCompanyBusinessType();
  const onOffice = isPharmacyOfficePath(pathname);
  const [hopFailed, setHopFailed] = useState(false);

  useEffect(() => {
    if (isLoading || !isPharmacyCompany || !onOffice || hopFailed) return;
    if (!isPharmacyAppSplitEnabled()) return;
    let cancelled = false;
    (async () => {
      const ok = await redirectToPharmacyApp(`${pathname}${search || ''}`);
      if (!cancelled && !ok) setHopFailed(true);
    })();
    return () => { cancelled = true; };
  }, [isLoading, isPharmacyCompany, onOffice, pathname, search, hopFailed]);

  if (!onOffice || isLoading || !isPharmacyCompany) {
    return children;
  }

  if (isPharmacyAppSplitEnabled() && !hopFailed) {
    return (
      <div className="p-6 text-slate-600 dark:text-slate-300">
        Перенаправление в приложение аптеки…
      </div>
    );
  }

  return <Navigate to="/cashier/pos" replace />;
}
