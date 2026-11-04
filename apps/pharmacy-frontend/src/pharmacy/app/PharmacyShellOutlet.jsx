import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import PharmacyPageFallback from './PharmacyPageFallback';

/** Lazy page suspense stays inside shell — sidebar/topbar do not unmount. */
export default function PharmacyShellOutlet() {
  return (
    <Suspense fallback={<PharmacyPageFallback />}>
      <Outlet />
    </Suspense>
  );
}
